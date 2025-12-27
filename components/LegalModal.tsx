
import React from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; // Ensure you have a markdown renderer or just render plain text
import { LEGAL_DISCLAIMER_TEXT } from '../constants';

interface LegalModalProps {
  onAccept: () => void;
  isOpen: boolean;
  isViewOnly?: boolean;
  onClose?: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ onAccept, isOpen, isViewOnly = false, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-red-950/20">
          <ShieldAlert className="w-8 h-8 text-red-500" />
          <div>
             <h2 className="text-xl font-bold text-white">Legal Disclaimer</h2>
             <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Read Carefully</p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-300 text-sm leading-relaxed space-y-4">
           {/* Simple rendering of markdown-like text */}
           {LEGAL_DISCLAIMER_TEXT.split('###').map((section, index) => {
             if (!section.trim()) return null;
             const [title, ...body] = section.split('\n');
             return (
               <div key={index} className="mb-4">
                 <h3 className="font-bold text-white text-base mb-2">{title.replace('#', '').trim()}</h3>
                 <div className="whitespace-pre-line text-slate-400">{body.join('\n').trim()}</div>
               </div>
             );
           })}
        </div>

        {/* Footer / Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-900 rounded-b-2xl">
          {isViewOnly ? (
            <button
              onClick={onClose}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
            >
              Close
            </button>
          ) : (
            <div className="space-y-4">
                <p className="text-xs text-center text-slate-500">
                    By clicking "I Agree", you acknowledge that you have read and understood this disclaimer and release the author from liability.
                </p>
                <button
                    onClick={onAccept}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all"
                >
                    <CheckCircle2 className="w-5 h-5" />
                    I Agree & Accept Terms
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
