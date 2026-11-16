import React, { useState, useRef } from 'react';
import { Camera, Upload, ScanLine, X, QrCode } from 'lucide-react';

interface ScannerProps {
  onScanStart?: () => void;
  onScanComplete: (imageBase64: string, qrData: string | null) => void;
  onScanError?: (error: string) => void;
  isSubscribed?: boolean;
}

// Declare jsQR on window since it's loaded via script tag
declare global {
  interface Window {
    jsQR: (data: Uint8ClampedArray, width: number, height: number, options?: any) => { data: string } | null;
  }
}

const Scanner: React.FC<ScannerProps> = ({ onScanStart, onScanComplete, onScanError }) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    processFile(file);
  };

  const scanForQR = (imageSrc: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Limit size for performance
        const scale = Math.min(1, 1000 / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        const ctx = canvas.getContext('2d');
        if (ctx && window.jsQR) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = window.jsQR(imageData.data, imageData.width, imageData.height);
            resolve(code ? code.data : null);
          } catch (e) {
            console.error("QR Scan Error", e);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = imageSrc;
    });
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadstart = () => onScanStart?.();
    
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      
      // Extract base64 data only (remove "data:image/jpeg;base64," prefix)
      const base64Data = result.split(',')[1];
      
      // Attempt local QR Scan
      let detectedQR = null;
      try {
        detectedQR = await scanForQR(result);
        if (detectedQR) {
          console.log("Local QR Detected:", detectedQR);
        }
      } catch (err) {
        console.warn("Local QR detection failed", err);
      }

      onScanComplete(base64Data, detectedQR);
    };

    reader.onerror = () => onScanError?.("Failed to read image file.");
    reader.readAsDataURL(file);
  };

  const clearPreview = () => {
    setPreview(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-slate-850 p-6 rounded-2xl border border-slate-700 shadow-xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-450/10 mb-4 border border-emerald-450/30">
            <ScanLine className="w-8 h-8 text-emerald-450 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Ingredient Scanner</h2>
          <p className="text-slate-400 mt-2 text-sm">Capture label or QR code.</p>
        </div>

        {/* Input Area */}
        <div className="relative group">
          {/* Camera Input (forces camera on mobile) */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Gallery Input (standard file picker) */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          
          {!preview ? (
            <div className="flex flex-col gap-4">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-3"
              >
                <Camera className="w-6 h-6" />
                <span>Capture Label / QR</span>
              </button>
              
              <div className="text-center">
                 <p className="text-xs text-slate-500 uppercase tracking-widest">or</p>
              </div>

               <button
                onClick={() => galleryInputRef.current?.click()}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-semibold rounded-xl transition-all flex items-center justify-center gap-3"
              >
                <Upload className="w-5 h-5" />
                <span>Upload from Gallery</span>
              </button>
            </div>
          ) : (
             <div className="relative rounded-xl overflow-hidden border border-slate-600">
               <img src={preview} alt="Scan preview" className="w-full h-64 object-cover opacity-50" />
               <div className="absolute inset-0 flex items-center justify-center flex-col p-4 bg-black/40 backdrop-blur-sm">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mb-4"></div>
                 <p className="text-white font-medium">Agents Analyzing...</p>
                 <p className="text-xs text-slate-300 mt-2">Processing Image & QR Data</p>
               </div>
               <button 
                 onClick={clearPreview}
                 className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-slate-500">
          <QrCode className="w-4 h-4" />
          <p className="text-[10px]">
            Integrated QR Code Detection
          </p>
        </div>
      </div>
    </div>
  );
};

export default Scanner;