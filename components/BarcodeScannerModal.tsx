'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  keepOpenOnScan?: boolean;
}

export default function BarcodeScannerModal({ isOpen, onClose, onScan, keepOpenOnScan = false }: Props) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const lastScannedRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const html5QrcodeRef = useRef<any>(null);

  const cleanup = useCallback(() => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          html5QrcodeRef.current.stop().catch(console.error);
        }
      } catch (e) {
        console.error(e);
      }
      html5QrcodeRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    async function startCamera() {
      try {
        setErrorMsg('');
        setHasPermission(null);

        // Dynamically import the html5-qrcode scanner
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!active) return;

        // Create the instance first on our container
        const html5QrCode = new Html5Qrcode('reader-container');
        html5QrcodeRef.current = html5QrCode;

        // 1. Request camera list (this triggers the browser permission dialog if not already granted)
        let devices: any[] = [];
        try {
          devices = await Html5Qrcode.getCameras();
        } catch (err: any) {
          console.warn('getCameras failed, attempting direct facingMode start:', err);
        }

        if (!active) return;

        const config = {
          fps: 15,
          qrbox: (width: number, height: number) => {
            const size = Math.min(width, height) * 0.7;
            return { width: size, height: size };
          },
        };

        const onScanSuccess = (decodedText: string) => {
          if (active) {
            if (keepOpenOnScan) {
              if (decodedText !== lastScannedRef.current.code || Date.now() - lastScannedRef.current.time > 1500) {
                lastScannedRef.current = { code: decodedText, time: Date.now() };
                onScan(decodedText);
              }
            } else {
              onScan(decodedText);
              cleanup();
              onClose();
            }
          }
        };

        // 2. Select the camera to start
        if (devices && devices.length > 0) {
          setHasPermission(true);

          // Find back camera by label matching common terms
          let selectedCameraId = devices[0].id;
          const backCamera = devices.find(device => 
            /back|rear|environment|retro/i.test(device.label || '')
          );

          if (backCamera) {
            selectedCameraId = backCamera.id;
          } else if (devices.length > 1) {
            // Typically on mobile, the back camera is the last device in the list
            selectedCameraId = devices[devices.length - 1].id;
          }

          await html5QrCode.start(
            selectedCameraId,
            config,
            onScanSuccess,
            () => {} // Verbose check errors, ignore
          );
        } else {
          // Fallback option: if getCameras returned empty list or failed, try starting with facingMode constraint
          await html5QrCode.start(
            { facingMode: 'environment' },
            config,
            onScanSuccess,
            () => {}
          );
          setHasPermission(true);
        }

      } catch (err: any) {
        console.error('Camera initialization error:', err);
        if (!active) return;
        
        const msg = err?.message || String(err);
        if (msg.includes('NotAllowedError') || msg.includes('Permission') || msg.includes('permission')) {
          setHasPermission(false);
          setErrorMsg('Camera permission was denied. Please allow camera access in your browser settings.');
        } else if (msg.includes('NotFoundError') || msg.includes('not found') || msg.includes('Requested device not found')) {
          setErrorMsg('No camera found or could not access back camera on this device.');
        } else if (msg.includes('NotReadableError') || msg.includes('Could not start video source')) {
          setErrorMsg('Camera is in use by another app or browser tab. Please close them and try again.');
        } else {
          setHasPermission(false);
          setErrorMsg(msg || 'Failed to access camera.');
        }
      }
    }

    startCamera();

    return () => {
      active = false;
      cleanup();
    };
  }, [isOpen, onClose, onScan, keepOpenOnScan, cleanup]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div key="scanner-modal-wrapper" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/75 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-slate-900 text-white rounded-2xl overflow-hidden max-w-md w-full border border-slate-800 shadow-2xl z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📷</span>
                  <div>
                    <h3 className="text-sm font-black tracking-wide uppercase font-heading">
                      Scan Barcode / QR Code
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Barcode Scanner Active
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors font-bold text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Scanner Viewport */}
              <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
                {errorMsg ? (
                  <div className="p-6 text-center space-y-3">
                    <span className="text-3xl block">⚠️</span>
                    <p className="text-sm font-bold text-red-400">{errorMsg}</p>
                    <p className="text-xs text-slate-400">
                      Please verify camera permissions in your browser settings and try again.
                    </p>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-xs font-bold rounded-lg border border-slate-700 cursor-pointer"
                    >
                      Close Scanner
                    </button>
                  </div>
                ) : hasPermission === null ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-[#0050e8] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Accessing Camera...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Target overlay */}
                    <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                      <div className="w-3/4 h-3/4 border-2 border-dashed border-white/40 rounded-xl relative">
                        {/* Corners */}
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#0050e8] rounded-tl-md"></div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#0050e8] rounded-tr-md"></div>
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#0050e8] rounded-bl-md"></div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#0050e8] rounded-br-md"></div>

                        {/* Scanning line animation */}
                        <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444] animate-[scan_2s_ease-in-out_infinite]"></div>
                      </div>
                    </div>

                    <div id="reader-container" className="w-full h-full object-cover [&_video]:object-cover" />
                  </>
                )}
              </div>

              {/* Footer Guide */}
              <div className="p-4 bg-slate-950 text-center">
                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider leading-relaxed">
                  Place the barcode or QR code in the center of the camera screen.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes scan {
          0% { top: 12.5%; }
          50% { top: 87.5%; }
          100% { top: 12.5%; }
        }
      `}</style>
    </>
  );
}
