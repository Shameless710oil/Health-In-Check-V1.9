
import React, { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';
import { X, MessageSquare, Bug, Lightbulb, Send, Loader2, CheckCircle2 } from 'lucide-react';

interface BetaFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BetaFeedbackModal: React.FC<BetaFeedbackModalProps> = ({ isOpen, onClose }) => {
  const [type, setType] = useState<'BUG' | 'FEATURE' | 'OTHER'>('BUG');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const submitViaApi = async (feedbackType: 'BUG' | 'FEATURE' | 'OTHER', feedbackMessage: string) => {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: feedbackType, message: feedbackMessage })
    });
    if (!response.ok) {
      throw new Error(`Feedback API returned ${response.status}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      let submittedToSupabase = false;
      if (isSupabaseConfigured) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase.from('beta_feedback').insert({
            user_id: user.id,
            type,
            message: trimmed,
            rating: 5
          });
          if (error) throw error;
          submittedToSupabase = true;
        }
      }

      if (!submittedToSupabase) {
        await submitViaApi(type, trimmed);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setMessage('');
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white">Beta Feedback</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-12 flex flex-col items-center text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 animate-float" />
            <h3 className="text-xl font-bold text-white mb-2">Received!</h3>
            <p className="text-slate-400">Thank you for helping us improve Health-In-Check.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setType('BUG')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'BUG' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'}`}
              >
                <Bug className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Bug</span>
              </button>
              <button
                type="button"
                onClick={() => setType('FEATURE')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'FEATURE' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'}`}
              >
                <Lightbulb className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Idea</span>
              </button>
              <button
                type="button"
                onClick={() => setType('OTHER')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'OTHER' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'}`}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Other</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={type === 'BUG' ? "Describe what happened..." : "What should we build next?"}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-sm focus:border-emerald-500 outline-none h-32 resize-none"
              />
            </div>

            {errorMsg && (
              <p className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Feedback
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default BetaFeedbackModal;
