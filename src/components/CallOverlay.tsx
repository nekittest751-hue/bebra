import React, { useState, useEffect } from 'react';
import { PhoneOff, MicOff, VideoOff, Mic, Video, Maximize } from 'lucide-react';
import clsx from 'clsx';
import useStore from '../store';
import { getSocket } from '../lib/socket';

export function CallOverlay({ chatName, onClose }: { chatName: string, onClose: () => void }) {
  const [status, setStatus] = useState<'calling' | 'ringing' | 'connected' | 'ended'>('calling');
  const [muted, setMuted] = useState(false);
  const [video, setVideo] = useState(true);

  useEffect(() => {
    // Simulate connection flow for demo
    const ringTimer = setTimeout(() => setStatus('ringing'), 2000);
    const connTimer = setTimeout(() => setStatus('connected'), 5000);
    return () => { clearTimeout(ringTimer); clearTimeout(connTimer); };
  }, []);

  const handleEnd = () => {
    setStatus('ended');
    setTimeout(onClose, 1000);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-2xl p-4">
      <div className={clsx(
        "w-full max-w-4xl aspect-video rounded-3xl overflow-hidden relative shadow-[0_0_50px_rgba(79,70,229,0.2)] transition-all duration-500",
        status === 'connected' ? 'bg-[#111]' : 'bg-white/5'
      )}>
        
        {/* Call Info layer */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none z-10">
          {status !== 'connected' && (
            <>
              <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center text-4xl mb-6 shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-indigo-500/50">
                {chatName[0].toUpperCase()}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{chatName}</h2>
              <p className="text-indigo-400 font-medium tracking-widest uppercase text-sm animate-pulse">
                {status === 'calling' ? 'Establishing P2P Route...' : 
                 status === 'ringing' ? 'Waiting for Answer...' : 'Call Ended'}
              </p>
            </>
          )}
        </div>

        {/* Video placeholders (simulate WebRTC connected state) */}
        {status === 'connected' && (
          <div className="absolute inset-0 grid grid-cols-2 gap-4 p-4">
            <div className="bg-black rounded-2xl overflow-hidden border border-white/10 relative">
               <div className="absolute top-4 left-4 bg-black/50 backdrop-blur text-xs px-2 py-1 rounded-md">You</div>
               <div className="w-full h-full flex items-center justify-center text-white/20"><VideoOff className="w-16 h-16"/></div>
            </div>
            <div className="bg-black rounded-2xl overflow-hidden border border-white/10 relative">
               <div className="absolute top-4 left-4 bg-black/50 backdrop-blur text-xs px-2 py-1 rounded-md">{chatName}</div>
               <div className="w-full h-full flex items-center justify-center text-white/20"><Video className="w-16 h-16 animate-pulse"/></div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-6 bg-black/40 backdrop-blur-xl px-8 py-4 rounded-full border border-white/10 z-20 pointer-events-auto shadow-2xl">
          <button 
            onClick={() => setMuted(!muted)} 
            className={clsx("p-4 rounded-full transition-all", muted ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-white/10 text-white hover:bg-white/20")}
          >
            {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          
          <button 
            onClick={handleEnd}
            className="p-5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all hover:scale-110"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
          
          <button 
            onClick={() => setVideo(!video)}
            className={clsx("p-4 rounded-full transition-all", !video ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-white/10 text-white hover:bg-white/20")}
          >
            {video ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>
        </div>

      </div>
    </div>
  );
}
