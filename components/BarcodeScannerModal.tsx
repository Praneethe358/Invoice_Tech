'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InvoiceItem } from '@/lib/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  keepOpenOnScan?: boolean;
  
  // Optional props for invoice screen split-view mode
  items?: InvoiceItem[];
  onUpdateQty?: (name: string, qty: number, variantId?: string | null) => void;
  totalPrice?: number;
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  keepOpenOnScan = false,
  items,
  onUpdateQty,
  totalPrice = 0,
}: Props) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Camera state
  const [cameras, setCameras] = useState<any[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>('');
  const [torchOn, setTorchOn] = useState(false);
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const lastScannedRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const html5QrcodeRef = useRef<any>(null);

  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  
  const keepOpenOnScanRef = useRef(keepOpenOnScan);
  keepOpenOnScanRef.current = keepOpenOnScan;

  const isSplitView = items !== undefined;

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

  // Check torch/flashlight support on current video stream
  const checkTorchSupport = () => {
    try {
      const videoElement = document.querySelector('#reader-container video') as HTMLVideoElement;
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities = track.getCapabilities() as any;
          setIsTorchSupported(!!capabilities.torch);
        }
      }
    } catch (e) {
      console.warn('Failed to check torch support:', e);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    async function startCamera() {
      try {
        setErrorMsg('');
        setHasPermission(null);
        setTorchOn(false);
        setIsTorchSupported(false);
        setIsSettingsOpen(false);

        // Dynamically import the html5-qrcode scanner
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!active) return;

        // Create the instance first on our container (guaranteed to be in the DOM)
        const html5QrCode = new Html5Qrcode('reader-container');
        html5QrcodeRef.current = html5QrCode;

        // 1. Request camera list
        let devices: any[] = [];
        try {
          devices = await Html5Qrcode.getCameras();
          if (active) {
            setCameras(devices);
          }
        } catch (err: any) {
          console.warn('getCameras failed, attempting direct facingMode start:', err);
        }

        if (!active) return;

        // Setup scan success callback
        const onScanSuccess = (decodedText: string) => {
          if (active) {
            if (keepOpenOnScanRef.current) {
              if (decodedText !== lastScannedRef.current.code || Date.now() - lastScannedRef.current.time > 1500) {
                lastScannedRef.current = { code: decodedText, time: Date.now() };
                onScanRef.current(decodedText);
              }
            } else {
              onScanRef.current(decodedText);
              cleanup();
              onClose();
            }
          }
        };

        const width = document.getElementById('reader-container')?.clientWidth || 300;
        const height = document.getElementById('reader-container')?.clientHeight || 300;
        const size = Math.min(width * 0.7, 260);

        const config = {
          fps: 25,
          qrbox: { width: size, height: size },
          aspectRatio: 1.0, // Match viewport container shape
          useBarCodeDetectorIfSupported: true,
        };

        // 2. Start the selected/default camera
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
            selectedCameraId = devices[devices.length - 1].id;
          }

          setActiveCameraId(selectedCameraId);

          await html5QrCode.start(
            selectedCameraId,
            config,
            onScanSuccess,
            () => {} // ignore verbose errors
          );
        } else {
          // Fallback option: facingMode constraint
          await html5QrCode.start(
            { facingMode: 'environment' },
            config,
            onScanSuccess,
            () => {}
          );
          setHasPermission(true);
        }

        // Give the camera a brief moment to warm up, then check torch capabilities
        setTimeout(() => {
          if (active) checkTorchSupport();
        }, 800);

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

    const delayTimer = setTimeout(() => {
      startCamera();
    }, 200);

    return () => {
      clearTimeout(delayTimer);
      active = false;
      cleanup();
    };
  }, [isOpen, onClose, cleanup]);

  // Toggle flash/torch
  const toggleTorch = async () => {
    try {
      const videoElement = document.querySelector('#reader-container video') as HTMLVideoElement;
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities = track.getCapabilities() as any;
          if (capabilities.torch) {
            const nextTorchState = !torchOn;
            await track.applyConstraints({
              advanced: [{ torch: nextTorchState } as any]
            });
            setTorchOn(nextTorchState);
          }
        }
      }
    } catch (err) {
      console.error('Failed to toggle torch:', err);
    }
  };

  // Cycle through cameras list
  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    
    await switchCameraToId(nextCamera.id);
  };

  // Switch camera to a specific ID
  const switchCameraToId = async (id: string) => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
        setActiveCameraId(id);
        setTorchOn(false);
        setIsTorchSupported(false);

        const width = document.getElementById('reader-container')?.clientWidth || 300;
        const height = document.getElementById('reader-container')?.clientHeight || 300;
        const size = Math.min(width * 0.7, 260);

        const config = {
          fps: 25,
          qrbox: { width: size, height: size },
          aspectRatio: 1.0,
          useBarCodeDetectorIfSupported: true,
        };

        const onScanSuccess = (decodedText: string) => {
          if (keepOpenOnScanRef.current) {
            if (decodedText !== lastScannedRef.current.code || Date.now() - lastScannedRef.current.time > 1500) {
              lastScannedRef.current = { code: decodedText, time: Date.now() };
              onScanRef.current(decodedText);
            }
          } else {
            onScanRef.current(decodedText);
            cleanup();
            onClose();
          }
        };

        await html5QrcodeRef.current.start(
          id,
          config,
          onScanSuccess,
          () => {}
        );

        setTimeout(() => {
          checkTorchSupport();
        }, 800);

      } catch (err) {
        console.error('Failed to switch camera source:', err);
      }
    }
  };

  const totalQty = items ? items.reduce((sum, i) => sum + i.quantity, 0) : 0;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div 
            key="scanner-modal-wrapper" 
            className={`fixed inset-0 z-50 flex items-center justify-center ${
              isSplitView ? 'p-0 lg:p-4' : 'p-4'
            }`}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />

            {/* Main Scanner Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: isSplitView ? 30 : 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: isSplitView ? 30 : 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={
                isSplitView
                  ? "relative bg-black text-white w-full h-full lg:h-[88vh] lg:max-w-md lg:rounded-[36px] overflow-hidden flex flex-col border border-slate-900/60 shadow-2xl z-10"
                  : "relative bg-slate-900 text-white rounded-2xl overflow-hidden max-w-md w-full border border-slate-800 shadow-2xl z-10"
              }
            >
              {/* Header for Standard/Compact View */}
              {!isSplitView && (
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📷</span>
                    <div>
                      <h3 className="text-sm font-black tracking-wide uppercase font-heading">
                        Scan Barcode / QR Code
                      </h3>
                      <p className="text-[10px] text-slate-450 font-semibold">
                        Barcode Scanner Active
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors font-bold text-slate-400 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Camera Viewport Section */}
              <div 
                className={`relative bg-black flex items-center justify-center overflow-hidden flex-shrink-0 ${
                  isSplitView ? 'w-full h-[45vh]' : 'aspect-square w-full'
                }`}
              >
                {errorMsg ? (
                  <div className="p-6 text-center space-y-3 z-40">
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
                ) : (
                  <>
                    {/* Accessing camera progress placeholder */}
                    {hasPermission === null && (
                      <div className="absolute inset-0 z-30 bg-black flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-4 border-[#0050e8] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Accessing Camera...
                        </p>
                      </div>
                    )}

                    {/* Camera view container - Html5Qrcode binds here */}
                    <div id="reader-container" className="w-full h-full object-cover [&_video]:object-cover z-10" />

                    {/* Back / Close button (overlayed in split view) */}
                    {isSplitView && (
                      <button
                        onClick={onClose}
                        className="absolute left-4 top-4 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer"
                        title="Close Scanner"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}

                    {/* Side Action Buttons for Camera control (Torch, Settings, Cameras) */}
                    {hasPermission && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4.5 z-30">
                        {/* Settings gear */}
                        {cameras.length > 0 && (
                          <button
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            className={`w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                              isSettingsOpen 
                                ? 'bg-[#0050e8] border-[#0050e8] text-white shadow-lg' 
                                : 'bg-black/40 border-white/10 text-white/90 hover:bg-black/60'
                            }`}
                            title="Camera Settings"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isSettingsOpen ? 'animate-spin-slow' : ''}>
                              <circle cx="12" cy="12" r="3" />
                              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                          </button>
                        )}

                        {/* Flashlight/Torch toggle */}
                        {isTorchSupported && (
                          <button
                            onClick={toggleTorch}
                            className={`w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                              torchOn 
                                ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' 
                                : 'bg-black/40 border-white/10 text-white/90 hover:bg-black/60'
                            }`}
                            title="Toggle Torch/Flash"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M15 17H9" />
                              <path d="M18.5 5.5a2.5 2.5 0 0 0-3.5 0L8.5 12H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h3.5l6.5 6.5a2.5 2.5 0 0 0 3.5 0v-20z" />
                            </svg>
                          </button>
                        )}

                        {/* Switch Camera */}
                        {cameras.length > 1 && (
                          <button
                            onClick={switchCamera}
                            className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/90 hover:bg-black/60 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                            title="Switch Camera Device"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M23 4v6h-6" />
                              <path d="M1 20v-6h6" />
                              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Camera Select Dropdown Overlay */}
                    {isSettingsOpen && cameras.length > 0 && (
                      <>
                        <div className="fixed inset-0 z-35" onClick={() => setIsSettingsOpen(false)} />
                        <div className="absolute right-18 top-1/2 -translate-y-1/2 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-2xl p-2 z-40 max-w-[200px] shadow-2xl">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider px-2.5 py-1.5 border-b border-slate-800 mb-1">
                            Select Camera
                          </p>
                          <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto pr-1">
                            {cameras.map((camera) => (
                              <button
                                key={camera.id}
                                onClick={() => {
                                  setIsSettingsOpen(false);
                                  if (camera.id !== activeCameraId) {
                                    switchCameraToId(camera.id);
                                  }
                                }}
                                className={`text-left px-2.5 py-2 text-[10px] font-bold rounded-xl truncate transition-all cursor-pointer ${
                                  activeCameraId === camera.id
                                    ? 'bg-[#0050e8] text-white shadow-sm'
                                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                                }`}
                              >
                                {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Target overlay: custom green reticle overlay */}
                    {hasPermission && (
                      <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                        <div className="w-64 h-64 relative flex items-center justify-center">
                          {/* Green Corners */}
                          <div className="absolute top-0 left-0 w-8 h-8 border-t-[4px] border-l-[4px] border-emerald-400 rounded-tl-lg"></div>
                          <div className="absolute top-0 right-0 w-8 h-8 border-t-[4px] border-r-[4px] border-emerald-400 rounded-tr-lg"></div>
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[4px] border-l-[4px] border-emerald-400 rounded-bl-lg"></div>
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[4px] border-r-[4px] border-emerald-400 rounded-br-lg"></div>

                          {/* Laser Scan line animation */}
                          <div className="absolute left-2.5 right-2.5 h-[2px] bg-emerald-400/80 shadow-[0_0_15px_#34d399] animate-[scan_2.5s_ease-in-out_infinite]"></div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Scanned Items split view layout */}
              {isSplitView ? (
                <div className="flex-1 bg-slate-50 rounded-t-[32px] overflow-hidden flex flex-col text-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-20 -mt-6">
                  <div className="p-6 flex-1 flex flex-col min-h-0">
                    
                    {/* Section Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col">
                        <h4 className="text-base font-black text-slate-800 uppercase tracking-wide">
                          Scanned Items
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">
                          {totalQty} {totalQty === 1 ? 'item' : 'items'} total
                        </span>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Total Price
                        </span>
                        <span className="text-lg font-black text-[#0050e8] tabular-nums mt-0.5">
                          ₹{totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Scrollable list container */}
                    <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-2.5">
                      <AnimatePresence initial={false}>
                        {items && items.length > 0 ? (
                          items.map((item) => (
                            <motion.div
                              key={`${item.name}-${item.variant_id}`}
                              initial={{ opacity: 0, y: 12, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              className="flex justify-between items-center py-3 px-4 bg-white border border-slate-150 rounded-2xl shadow-3xs hover:border-slate-200 transition-colors"
                            >
                              <div className="flex flex-col min-w-0 pr-2">
                                <span className="text-xs font-black text-slate-800 uppercase tracking-wide truncate">
                                  {item.name}
                                </span>
                                <span className="text-[10px] text-slate-450 font-bold mt-0.5">
                                  ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              
                              {/* Quantity adjuster */}
                              <div className="flex items-center bg-slate-100 border border-slate-200/50 rounded-full p-0.5 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => onUpdateQty && onUpdateQty(item.name, item.quantity - 1, item.variant_id)}
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors font-black text-sm active:scale-90 cursor-pointer"
                                >
                                  −
                                </button>
                                <span className="px-2 text-xs font-black text-slate-800 w-5 text-center tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateQty && onUpdateQty(item.name, item.quantity + 1, item.variant_id)}
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors font-black text-sm active:scale-90 cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          // List is empty state
                          <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center my-auto">
                            <div className="w-16 h-16 bg-slate-100/80 border border-slate-200/50 text-slate-400 rounded-full flex items-center justify-center mb-3">
                              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-75">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <path d="M7 7h10" />
                                <path d="M7 12h10" />
                                <path d="M7 17h10" />
                              </svg>
                            </div>
                            <p className="text-sm font-black text-slate-800 uppercase tracking-wide">
                              List is empty
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1.5 max-w-[240px] leading-relaxed font-semibold">
                              Scanned items will appear here as you scan them with the camera above.
                            </p>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Footer Action Button */}
                    <div className="pt-4 border-t border-slate-200/60 bg-white -mx-6 -mb-6 p-6 flex-shrink-0">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={!items || items.length === 0}
                        className="w-full py-3.5 bg-[#0050e8] hover:bg-[#0043c4] disabled:bg-slate-200 disabled:text-slate-450 disabled:shadow-none text-white text-xs font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#0050e8]/20 transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                        <span>Review Order</span>
                      </button>
                    </div>

                  </div>
                </div>
              ) : (
                /* Standard Footer Guide for Compact view */
                <div className="p-4 bg-slate-950 text-center">
                  <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider leading-relaxed">
                    Place the barcode or QR code in the center of the camera screen.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes scan {
          0% { top: 6%; }
          50% { top: 92%; }
          100% { top: 6%; }
        }
        .animate-spin-slow {
          animation: spin 6s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
    </>
  );
}
