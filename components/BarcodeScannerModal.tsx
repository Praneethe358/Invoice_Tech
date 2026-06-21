'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const lastScannedRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const html5QrcodeRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Load fallback script if native is not supported
  useEffect(() => {
    if (!isOpen) return;

    const hasNative = typeof window !== 'undefined' && 'BarcodeDetector' in window;
    if (hasNative) {
      setIsScriptLoaded(true);
      return;
    }

    // Check if script is already present
    if ((window as any).Html5Qrcode) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => setErrorMsg('Failed to load fallback scanner library');
    document.body.appendChild(script);

    return () => {
      // Don't remove script, just keep it cached
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isScriptLoaded) return;

    let active = true;

    async function startCamera() {
      try {
        setErrorMsg('');
        const constraints = {
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!active) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        setHasPermission(true);

        const hasNative = 'BarcodeDetector' in window;
        if (hasNative && videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play();

          // Initialize native detector
          const formats = ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e'];
          // eslint-disable-next-line no-undef
          const detector = new (window as any).BarcodeDetector({ formats });

          const detectFrame = async () => {
            if (!active || !videoRef.current || videoRef.current.readyState < 2) {
              animationFrameRef.current = requestAnimationFrame(detectFrame);
              return;
            }

            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0 && active) {
                const code = barcodes[0].rawValue;
                if (keepOpenOnScan) {
                  if (code !== lastScannedRef.current.code || Date.now() - lastScannedRef.current.time > 1500) {
                    lastScannedRef.current = { code, time: Date.now() };
                    onScan(code);
                  }
                } else {
                  onScan(code);
                  cleanup();
                  onClose();
                  return;
                }
              }
            } catch (err) {
              console.error('Detection error:', err);
            }

            if (active) {
              animationFrameRef.current = requestAnimationFrame(detectFrame);
            }
          };

          animationFrameRef.current = requestAnimationFrame(detectFrame);
        } else {
          // Use html5-qrcode fallback
          setTimeout(() => {
            if (!active) return;
            try {
              const Html5Qrcode = (window as any).Html5Qrcode;
              if (!Html5Qrcode) {
                setErrorMsg('Scanner fallback library not initialized.');
                return;
              }

              const html5QrCode = new Html5Qrcode('reader-container');
              html5QrcodeRef.current = html5QrCode;

              html5QrCode.start(
                { facingMode: 'environment' },
                {
                  fps: 15,
                  qrbox: (width: number, height: number) => {
                    const size = Math.min(width, height) * 0.7;
                    return { width: size, height: size };
                  },
                },
                (decodedText: string) => {
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
                },
                () => {
                  // Verbose errors from scan loop, ignore
                }
              ).catch((err: any) => {
                console.error('html5-qrcode start failed:', err);
                setErrorMsg('Failed to start camera scan stream.');
              });
            } catch (err: any) {
              console.error('Fallback setup error:', err);
              setErrorMsg(err.message || 'Failed to setup fallback scanner.');
            }
          }, 300);
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        setHasPermission(false);
        setErrorMsg(err.message || 'Camera access denied or device not found.');
      }
    }

    startCamera();

    return () => {
      active = false;
      cleanup();
    };

    function cleanup() {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [isOpen, isScriptLoaded, onClose, onScan]);

  const isNative = typeof window !== 'undefined' && 'BarcodeDetector' in window;

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
                      {isNative ? 'Native scanner active' : 'Fallback scanner active'}
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
                      className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-xs font-bold rounded-lg border border-slate-700"
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
                    {/* Target overlay pointer */}
                    <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                      <div className="w-3/4 h-3/4 border-2 border-dashed border-white/40 rounded-xl relative">
                        {/* Corners */}
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#0050e8] rounded-tl-md"></div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#0050e8] rounded-tr-md"></div>
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#0050e8] rounded-bl-md"></div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#0050e8] rounded-br-md"></div>

                        {/* Scanning red line animation */}
                        <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444] animate-[scan_2s_ease-in-out_infinite]"></div>
                      </div>
                    </div>

                    {isNative ? (
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                    ) : (
                      <div id="reader-container" className="w-full h-full object-cover [&_video]:object-cover" />
                    )}
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
