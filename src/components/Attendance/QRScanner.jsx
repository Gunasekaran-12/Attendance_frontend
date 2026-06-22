import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const QRScanner = ({ onScanSuccess, active = true }) => {
    const toast = useToast();
    const [hasCamera, setHasCamera] = useState(true);
    const [cameraStarted, setCameraStarted] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [scanFeedback, setScanFeedback] = useState(null); // 'SUCCESS' or null
    const [mockId, setMockId] = useState(''); // Mock scanning for devices without camera

    const qrScannerRef = useRef(null);
    const scannerId = "qr-video-container";

    useEffect(() => {
        if (!active) {
            stopScanner();
            return;
        }

        // Initialize and check for cameras
        Html5Qrcode.getCameras()
            .then(devices => {
                if (devices && devices.length > 0) {
                    setCameras(devices);
                    setSelectedCameraId(devices[0].id);
                    setHasCamera(true);
                } else {
                    setHasCamera(false);
                    setErrorMsg("No camera devices detected on this system.");
                }
            })
            .catch(err => {
                console.error("Camera listing error:", err);
                setHasCamera(false);
                setErrorMsg("Permission denied or camera blocked by browser.");
            });

        return () => {
            stopScanner();
        };
    }, [active]);

    const startScanner = async (cameraId) => {
        if (!cameraId) return;
        setErrorMsg('');
        
        try {
            if (qrScannerRef.current) {
                await stopScanner();
            }

            const html5QrCode = new Html5Qrcode(scannerId);
            qrScannerRef.current = html5QrCode;

            await html5QrCode.start(
                cameraId,
                {
                    fps: 10,
                    qrbox: (width, height) => {
                        const minDim = Math.min(width, height);
                        return {
                            width: Math.floor(minDim * 0.7),
                            height: Math.floor(minDim * 0.7)
                        };
                    }
                },
                (decodedText, decodedResult) => {
                    handleScan(decodedText);
                },
                (errorMessage) => {
                    // Verbose debug log ignored to prevent console clutter
                }
            );

            setCameraStarted(true);
        } catch (err) {
            console.error("Failed to start camera:", err);
            setErrorMsg("Could not access camera stream. Check permissions.");
            setCameraStarted(false);
        }
    };

    const stopScanner = async () => {
        if (qrScannerRef.current && qrScannerRef.current.isScanning) {
            try {
                await qrScannerRef.current.stop();
                setCameraStarted(false);
            } catch (err) {
                console.error("Failed to stop scanner:", err);
            }
        }
    };

    const handleCameraChange = (e) => {
        const id = e.target.value;
        setSelectedCameraId(id);
        if (cameraStarted) {
            startScanner(id);
        }
    };

    const handleScan = (decodedText) => {
        // Trigger scanning feedback
        setScanFeedback('SUCCESS');
        setTimeout(() => setScanFeedback(null), 1500);

        // Play standard soft check-in beep sound (synthesized via Web Audio API, works offline!)
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
            gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.15);
        } catch (e) {
            console.log("Audio feedback error:", e);
        }

        onScanSuccess(decodedText);
    };

    const triggerMockScan = (e) => {
        e.preventDefault();
        if (!mockId.trim()) return;
        handleScan(mockId);
        toast.success(`Simulated QR Scan: ID #${mockId}`);
        setMockId('');
    };

    return (
        <div className="max-w-md mx-auto space-y-6">
            {/* Scanner Display Box */}
            <div className="relative aspect-square w-full bg-slate-950 dark:bg-black rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl flex flex-col items-center justify-center">
                {/* QR Video mount target */}
                <div id={scannerId} className="absolute inset-0 w-full h-full object-cover [&>video]:object-cover" />

                {/* Scanning overlay guidelines */}
                {cameraStarted && !scanFeedback && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                        {/* Shaded border corners */}
                        <div className="w-[60%] h-[60%] border-2 border-indigo-500/50 rounded-3xl relative">
                            {/* Glowing horizontal line scan animation */}
                            <div className="absolute left-0 right-0 h-0.5 bg-indigo-500 shadow-lg shadow-indigo-500/50 animate-bounce top-0" style={{ animationDuration: '3s' }} />
                            
                            {/* Corner bracket accents */}
                            <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-indigo-600 rounded-tl-xl" />
                            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-indigo-600 rounded-tr-xl" />
                            <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-indigo-600 rounded-bl-xl" />
                            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-indigo-600 rounded-br-xl" />
                        </div>
                    </div>
                )}

                {/* Scan Success Indicator */}
                {scanFeedback === 'SUCCESS' && (
                    <div className="absolute inset-0 bg-emerald-600/90 flex flex-col items-center justify-center z-25 text-white animate-fade-in">
                        <CheckCircle2 className="w-20 h-20 animate-scale-up" />
                        <h3 className="text-xl font-black uppercase tracking-widest mt-4">Verified Scan</h3>
                        <p className="text-xs font-bold text-emerald-250 mt-1">ATTENDANCE LOGGED</p>
                    </div>
                )}

                {/* Camera off/loading state */}
                {!cameraStarted && !scanFeedback && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 z-10 bg-slate-900/90 text-center">
                        <CameraOff className="w-12 h-12 mb-4 text-slate-500" />
                        <p className="font-bold text-sm tracking-wide text-white uppercase">Camera Feed Inactive</p>
                        {errorMsg ? (
                            <p className="text-xs text-rose-400 font-semibold mt-2 max-w-[250px]">{errorMsg}</p>
                        ) : (
                            <p className="text-xs text-slate-400 mt-2">Grant permissions and launch camera below.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="dashboard-widget p-6 flex flex-col gap-4">
                {hasCamera && cameras.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Select Active Lens</label>
                        <select
                            value={selectedCameraId}
                            onChange={handleCameraChange}
                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer appearance-none"
                            disabled={cameras.length <= 1}
                        >
                            {cameras.map(cam => (
                                <option key={cam.id} value={cam.id}>
                                    {cam.label || `Camera ${cam.id.slice(0, 5)}`}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex gap-3">
                    {hasCamera ? (
                        <button
                            onClick={() => cameraStarted ? stopScanner() : startScanner(selectedCameraId)}
                            className={`flex-1 py-4 rounded-2xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                                cameraStarted 
                                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                            }`}
                        >
                            <Camera className="w-4 h-4" />
                            {cameraStarted ? 'Terminate Stream' : 'Initialize Camera'}
                        </button>
                    ) : (
                        <div className="flex-1 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                            <span className="text-xs text-amber-800 dark:text-amber-300 font-bold leading-relaxed">Camera unavailable on this device. Use manual simulation below.</span>
                        </div>
                    )}
                </div>

                {/* Mock/Simulated Scanner Form (Essential for testing and devices without camera) */}
                <div className="h-px bg-slate-100 dark:bg-slate-800/80 my-2" />
                <form onSubmit={triggerMockScan} className="space-y-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Simulate QR Scan (Offline Tester)</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Enter Student ID (e.g. 1, 2, 3)"
                            value={mockId}
                            onChange={(e) => setMockId(e.target.value)}
                            className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-sm"
                        />
                        <button
                            type="submit"
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/10"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Trigger
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QRScanner;
