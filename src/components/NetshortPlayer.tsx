import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, List, ChevronLeft, ChevronRight, Play, Pause, Type } from 'lucide-react';
import { HlsPlayer } from './HlsPlayer';

interface Subtitle {
  url: string;
  lang: string;
  label?: string;
}

interface NetshortPlayerProps {
  isLoadingStream: boolean;
  streamData: any;
  episodes: any[];
  currentEpisodeIndex: number;
  handleNextEpisode: () => void;
  handlePrevEpisode: () => void;
  setView: (view: any) => void;
  handlePlayEpisode: (ep: any) => void;
  getTitle: (item: any) => string;
  getStreamUrl: (data: any) => string | undefined;
}

export const NetshortPlayer = ({
  isLoadingStream,
  streamData,
  episodes,
  currentEpisodeIndex,
  handleNextEpisode,
  handlePrevEpisode,
  setView,
  handlePlayEpisode,
  getTitle,
  getStreamUrl
}: NetshortPlayerProps) => {
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [activeSubtitleIndex, setActiveSubtitleIndex] = useState(0); 
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  const handleAppClick = (e: React.MouseEvent) => {
     if (showEpisodes || showSubtitles) {
       setShowEpisodes(false);
       setShowSubtitles(false);
       resetControlsTimer();
     } else {
       if (showControls) {
          setShowControls(false);
          if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
       } else {
          resetControlsTimer();
       }
     }
  };

  const streamUrl = getStreamUrl(streamData);
  const isIframe = streamUrl && !(streamUrl.includes('.m3u8') || streamUrl.includes('.mp4') || streamUrl.includes('video.netshort.com') || streamUrl.includes('vividshort.com'));
  const subtitles = streamData?.data?.subtitles || streamData?.subtitles || [];

  return (
    <motion.div
      key="netshort-player"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full flex flex-col h-full bg-black z-50 absolute inset-0 fixed"
      onClick={handleAppClick}
    >
      {/* Video Content */}
      <div className="absolute inset-0 bg-[#050505] flex items-center justify-center">
        {isLoadingStream ? (
          <div className="flex flex-col items-center gap-3 text-amber-500 z-10">
            <Loader2 className="w-10 h-10 animate-spin" />
            <span className="text-white font-bold text-sm">Menyiapkan stream...</span>
          </div>
        ) : streamUrl ? (
           !isIframe ? (
              <HlsPlayer 
                ref={videoRef}
                key={streamUrl}
                src={streamUrl}
                className="w-full h-full object-contain md:object-cover"
                loop={false}
                subtitles={subtitles}
                activeSubtitleIndex={activeSubtitleIndex}
                onEnded={handleNextEpisode}
              />
           ) : (
             <iframe 
                src={streamUrl} 
                className="w-full h-full border-0 pointer-events-auto aspect-[9/16] max-w-lg mx-auto"
                allowFullScreen
                allow="autoplay; fullscreen"
              />
           )
        ) : (
          <div className="text-slate-500 text-center space-y-4 p-6 z-10">
            <span className="text-4xl">🎬</span>
            <p className="font-bold text-white">Stream tidak tersedia.</p>
            <button onClick={(e) => { e.stopPropagation(); window.location.reload(); }} className="px-4 py-2 bg-amber-500 text-black font-bold rounded-xl text-sm pointer-events-auto">Muat Ulang</button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between"
          >
            {/* Top Bar - FB Lite Style (Simple, high contrast) */}
            <div className="w-full p-4 pt-safe flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
               <div className="flex flex-col drop-shadow-md pointer-events-auto">
                 <h2 className="text-white font-bold text-lg md:text-xl line-clamp-1">Netshort Player</h2>
                 <span className="text-amber-500 font-bold text-xs uppercase tracking-widest">{currentEpisodeIndex >= 0 ? `Episode ${currentEpisodeIndex + 1}` : 'Memuat...'}</span>
               </div>
               <button 
                 onClick={(e) => { e.stopPropagation(); setView('home'); }}
                 className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white pointer-events-auto backdrop-blur-md"
               >
                 <X className="w-6 h-6" />
               </button>
            </div>

            {/* Bottom Controls - FB Lite Style */}
            <div className="w-full p-4 pb-safe bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col gap-4">
               <div className="flex items-center justify-between pointer-events-auto relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowEpisodes(false); setShowSubtitles(false); handlePrevEpisode(); resetControlsTimer(); }}
                    className="px-4 py-3 bg-white/10 rounded-xl text-white font-bold flex items-center gap-2 hover:bg-white/20 active:scale-95 transition-all backdrop-blur-md"
                  >
                    <ChevronLeft className="w-5 h-5" /> Prev
                  </button>
                  
                  <div className="flex gap-4">
                    {subtitles.length > 0 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowEpisodes(false); setShowSubtitles(!showSubtitles); resetControlsTimer(); }}
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all ${showSubtitles ? 'bg-amber-500 text-black scale-110' : 'bg-white/20 hover:bg-white/30 backdrop-blur-md'}`}
                      >
                        <Type className="w-6 h-6" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowSubtitles(false); setShowEpisodes(!showEpisodes); resetControlsTimer(); }}
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all ${showEpisodes ? 'bg-amber-500 text-black scale-110' : 'bg-white/20 hover:bg-white/30 backdrop-blur-md'}`}
                    >
                      <List className="w-6 h-6" />
                    </button>
                  </div>

                  <button 
                     onClick={(e) => { e.stopPropagation(); setShowEpisodes(false); setShowSubtitles(false); handleNextEpisode(); resetControlsTimer(); }}
                    className="px-4 py-3 bg-amber-500 rounded-xl text-black font-bold flex items-center gap-2 hover:bg-amber-400 active:scale-95 transition-all shadow-lg"
                  >
                    Next <ChevronRight className="w-5 h-5" />
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Episode Selection Overlay */}
      <AnimatePresence>
         {showEpisodes && (
           <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="absolute bottom-[100px] left-2 right-2 md:left-auto md:right-4 md:w-80 bg-[#161618]/95 backdrop-blur-xl border border-white/10 rounded-3xl z-30 overflow-hidden shadow-2xl pb-2 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
           >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                 <h3 className="font-bold text-white">Daftar Episode</h3>
                 <span className="text-xs text-amber-500 font-bold">{episodes.length} Eps</span>
              </div>
              <div className="max-h-[50vh] overflow-y-auto p-4 grid grid-cols-5 gap-2 no-scrollbar">
                 {episodes.map((ep, idx) => {
                    const isActive = idx === currentEpisodeIndex;
                    return (
                      <button
                        key={`ns-ep-${idx}`}
                        onClick={() => {
                          handlePlayEpisode(ep);
                          setShowEpisodes(false);
                          resetControlsTimer();
                        }}
                        className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all border ${
                          isActive
                            ? 'bg-amber-500 text-black border-amber-500 shadow-md'
                            : 'bg-black/50 text-slate-300 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                 })}
              </div>
           </motion.div>
         )}
      </AnimatePresence>

      {/* Subtitles Selection Overlay */}
      <AnimatePresence>
         {showSubtitles && (
           <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="absolute bottom-[100px] left-2 right-2 md:left-auto md:right-4 md:w-80 bg-[#161618]/95 backdrop-blur-xl border border-white/10 rounded-3xl z-30 overflow-hidden shadow-2xl pb-2 pointer-events-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
           >
              <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
                 <h3 className="font-bold text-white">Pilih Subtitle</h3>
              </div>
              <div className="max-h-[40vh] overflow-y-auto p-4 flex flex-col gap-2 no-scrollbar">
                  <button
                     onClick={() => { setActiveSubtitleIndex(-1); setShowSubtitles(false); resetControlsTimer(); }}
                     className={`w-full text-left px-5 py-4 rounded-2xl flex items-center justify-between transition-all border ${
                       activeSubtitleIndex === -1
                         ? 'bg-amber-500/10 text-amber-500 border-amber-500/50'
                         : 'bg-black/30 text-slate-300 border-white/5 hover:border-amber-500/30'
                     }`}
                  >
                     <span className="font-bold">Mati (Off)</span>
                  </button>
                  {subtitles.map((sub: any, idx: number) => {
                     const isActive = idx === activeSubtitleIndex;
                     return (
                        <button
                           key={`ns-sub-${idx}`}
                           onClick={() => { setActiveSubtitleIndex(idx); setShowSubtitles(false); resetControlsTimer(); }}
                           className={`w-full text-left px-5 py-4 rounded-2xl flex items-center justify-between transition-all border ${
                             isActive
                               ? 'bg-amber-500/10 text-amber-500 border-amber-500/50'
                               : 'bg-black/30 text-slate-300 border-white/5 hover:border-amber-500/30'
                           }`}
                        >
                           <span className="font-bold">{sub.label || sub.lang || `Subtitle ${idx + 1}`}</span>
                           {isActive && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                        </button>
                     );
                  })}
              </div>
           </motion.div>
         )}
      </AnimatePresence>
    </motion.div>
  );
};

