import React, { useState, useRef } from 'react';
import { Camera, Upload, ScanLine, X, QrCode, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface ScannerProps {
  onScanStart?: () => void;
  onScanComplete: (imageBase64: string, qrData: string | null) => void;
  onScanError?: (error: string) => void;
  isSubscribed?: boolean;
}

export interface SampleGroceryPreset {
  productName: string;
  ingredients: string[];
}

export const SAMPLE_GROCERY_PRESETS: SampleGroceryPreset[] = [
  {
    productName: 'Neon Nacho Cheese Chips',
    ingredients: [
      'Enriched Corn Meal',
      'Vegetable Oil',
      'Maltodextrin',
      'Yellow 6',
      'Yellow 5',
      'Red 40',
      'TBHQ',
      'Natural Flavors',
      'Citric Acid'
    ]
  },
  {
    productName: 'Enriched Soft White Bread',
    ingredients: [
      'Enriched Bleached Wheat Flour',
      'Potassium Bromate',
      'Azodicarbonamide',
      'High Fructose Corn Syrup',
      'Propylparaben',
      'Soybean Oil'
    ]
  },
  {
    productName: 'Tropical Red Energy Drink',
    ingredients: [
      'Carbonated Water',
      'High Fructose Corn Syrup',
      'Citric Acid',
      'Red 40',
      'Yellow 5',
      'Acesulfame Potassium',
      'Brominated Vegetable Oil',
      'Natural Flavors'
    ]
  }
];

const MAX_IMAGE_DIMENSION = 1280;
const JPEG_QUALITY = 0.82;

export const compressImageDataUrl = (
  imageSrc: string,
  maxDimension: number = MAX_IMAGE_DIMENSION,
  quality: number = JPEG_QUALITY
): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof document === 'undefined' || typeof Image === 'undefined') {
      resolve(imageSrc);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const longestEdge = Math.max(img.width || 0, img.height || 0);
        if (!longestEdge) {
          resolve(imageSrc);
          return;
        }
        const scale = Math.min(1, maxDimension / longestEdge);
        const targetWidth = Math.max(1, Math.round(img.width * scale));
        const targetHeight = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed && compressed.startsWith('data:image/') ? compressed : imageSrc);
      } catch {
        resolve(imageSrc);
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
};

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
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualProductName, setManualProductName] = useState('');
  const [manualIngredientsText, setManualIngredientsText] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processFile(file);
    // Reset input value immediately so selecting or shooting a photo again always triggers onChange
    e.target.value = '';
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
      try {
        const rawResult = e.target?.result as string;
        if (!rawResult) {
          onScanError?.("Failed to read image data.");
          return;
        }
        const compressedResult = await compressImageDataUrl(rawResult, MAX_IMAGE_DIMENSION, JPEG_QUALITY);
        setPreview(compressedResult);
        
        // Extract base64 data only (remove "data:image/jpeg;base64," prefix)
        const base64Data = compressedResult.includes(',')
          ? compressedResult.split(',')[1]
          : compressedResult;
        
        // Attempt local QR Scan
        let detectedQR = null;
        try {
          detectedQR = await scanForQR(rawResult);
          if (detectedQR) {
            console.log("Local QR Detected:", detectedQR);
          }
        } catch (err) {
          console.warn("Local QR detection failed", err);
        }

        onScanComplete(base64Data, detectedQR);
      } catch (err: any) {
        onScanError?.(err?.message || "Failed to process image file.");
      }
    };

    reader.onerror = () => onScanError?.("Failed to read image file.");
    reader.readAsDataURL(file);
  };

  const triggerStructuredScan = (productName: string, ingredients: string[]) => {
    onScanStart?.();
    onScanComplete('', JSON.stringify({ productName, ingredients }));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedIngredients = manualIngredientsText
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (parsedIngredients.length === 0) return;

    const productName = manualProductName.trim() || 'Custom Pasted Product';
    triggerStructuredScan(productName, parsedIngredients);
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

              {/* Paste Ingredients or Try Instant Sample */}
              <div className="mt-2 pt-4 border-t border-slate-700/80">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Paste Ingredients or Try Instant Sample
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {SAMPLE_GROCERY_PRESETS.map((preset) => (
                    <button
                      key={preset.productName}
                      type="button"
                      onClick={() => triggerStructuredScan(preset.productName, preset.ingredients)}
                      className="w-full min-h-[44px] px-3 py-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-xl text-left transition-all flex items-center justify-between gap-2 active:scale-[0.99]"
                    >
                      <span className="text-sm font-semibold text-slate-100">{preset.productName}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 shrink-0">
                        1-Tap Scan
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowManualInput((prev) => !prev)}
                  className="mt-3 w-full min-h-[44px] px-3 py-2 bg-slate-800/70 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 flex items-center justify-between"
                >
                  <span>Type or Paste Ingredients Directly</span>
                  {showManualInput ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showManualInput && (
                  <form onSubmit={handleManualSubmit} className="mt-3 flex flex-col gap-2.5">
                    <input
                      type="text"
                      value={manualProductName}
                      onChange={(e) => setManualProductName(e.target.value)}
                      placeholder="Product name (optional)"
                      aria-label="Product name"
                      className="w-full min-h-[44px] px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-base text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <textarea
                      rows={3}
                      value={manualIngredientsText}
                      onChange={(e) => setManualIngredientsText(e.target.value)}
                      placeholder="Paste ingredients (comma or line separated, e.g. Enriched Flour, Red 40, High Fructose Corn Syrup)"
                      aria-label="Ingredients list"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-base text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={!manualIngredientsText.trim()}
                      className="w-full min-h-[44px] py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl transition-all"
                    >
                      Analyze Ingredients
                    </button>
                  </form>
                )}
              </div>
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