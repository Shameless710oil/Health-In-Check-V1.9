
import React from 'react';
import { ShieldAlert, Key, Database, Globe, Copy, CheckCircle2 } from 'lucide-react';

const SetupGuide: React.FC = () => {
  const envVars = [
    {
      name: 'API_KEY',
      label: 'Google Gemini API Key',
      desc: 'Required for AI analysis.',
      found: !!process.env.API_KEY,
      url: 'https://aistudio.google.com/app/apikey'
    },
    {
      name: 'SUPABASE_URL',
      label: 'Supabase Project URL',
      desc: 'Connects to your database.',
      found: !!process.env.SUPABASE_URL,
      url: 'https://supabase.com/dashboard/project/_/settings/api'
    },
    {
      name: 'SUPABASE_ANON_KEY',
      label: 'Supabase Anon Key',
      desc: 'Public key for user authentication.',
      found: !!process.env.SUPABASE_ANON_KEY,
      url: 'https://supabase.com/dashboard/project/_/settings/api'
    }
  ];

  const allFound = envVars.every(v => v.found);

  if (allFound) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans text-slate-200">
      <div className="max-w-2xl w-full space-y-8">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4 border border-red-500/30">
            <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">System Offline</h1>
          <p className="text-slate-400">Environment variables are missing. The neural engine cannot start.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 border-b border-slate-800 pb-4">
            Required Configuration
          </h2>
          
          <div className="space-y-6">
            {envVars.map((env) => (
              <div key={env.name} className={`flex items-start gap-4 p-4 rounded-xl border ${env.found ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                <div className={`mt-1 p-2 rounded-lg ${env.found ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                   {env.name.includes('SUPABASE') ? <Database className="w-5 h-5" /> : <Key className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                   <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-white">{env.label}</h3>
                      {env.found ? (
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> Connected
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-red-400">Missing</span>
                      )}
                   </div>
                   <code className="block bg-black/30 p-2 rounded text-xs text-slate-400 font-mono mb-2">
                     {env.name}
                   </code>
                   <p className="text-xs text-slate-500 mb-3">{env.desc}</p>
                   {!env.found && (
                     <a 
                       href={env.url} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-blue-400 hover:text-white transition-colors"
                     >
                       <Globe className="w-3 h-3" /> Get this key
                     </a>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">How to fix this</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
             <li>Create a file named <code className="text-emerald-400">.env</code> in your project root.</li>
             <li>Paste the keys above into the file (Format: <code className="text-slate-500">KEY=value</code>).</li>
             <li>Restart your development server.</li>
             <li>If deploying to Vercel/Netlify, add these to "Environment Variables" in settings.</li>
          </ol>
        </div>

      </div>
    </div>
  );
};

export default SetupGuide;
