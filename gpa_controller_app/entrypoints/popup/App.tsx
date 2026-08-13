import { useState } from 'react';

export default function App() {
  return (
    <div className="w-80 p-4 bg-slate-900 text-white font-sans rounded-xl shadow-xl border border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <h1 className="text-lg font-bold text-byu-royal">BYU Grade Hub</h1>
        <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-medium">
          v1.0
        </span>
      </div>
      <p className="text-sm text-slate-400">
        Tailwind CSS v4 is configured and working!
      </p>
    </div>
  );
}
