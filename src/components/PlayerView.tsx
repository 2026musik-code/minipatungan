import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, List, Type, Download, FastForward, Rewind } from 'lucide-react';
import { HlsPlayer } from './HlsPlayer';

interface PlayerViewProps {
  isLoadingStream: boolean;
  streamData: any;
  selectedDrama: any;
  episodes: any[];
  currentEpisodeIndex: number;
  showPlayerControls: boolean;
  showPlayerEpisodeList: boolean;
  setShowPlayerEpisodeList: (show: boolean) => void;
  showSubtitleList: boolean;
  setShowSubtitleList: (show: boolean) => void;
  resetControlsTimer: () => void;
  handleTouchStart: (e: any) => void;
  handleTouchEnd: (e: any) => void;
  handleWheel: (e: any) => void;
  handleNextEpisode: () => void;
  setView: (view: any) => void;
  handlePlayEpisode: (ep: any) => void;
  getTitle: (item: any) => string;
  getStreamUrl: (data: any) => string | undefined;
  isVideoFile: (url: string) => boolean;
}

const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const PlayerView = ({
  isLoadingStream,
  streamData,
  selectedDrama,
  episodes,
  currentEpisodeIndex,
  showPlayerControls,
  showPlayerEpisodeList,
  setShowPlayerEpisodeList,
  showSubtitleList,
  setShowSubtitleList,
  resetControlsTimer,
  handleTouchStart,
  handleTouchEnd,
  handleWheel,
  handleNextEpisode,
  setView,
  handlePlayEpisode,
  getTitle,
  getStreamUrl,
  isVideoFile
}: PlayerViewProps) => {
  const [activeSubtitleIndex, setActiveSubtitleIndex] = useState(0); 
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  
  // Double tap to seek
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const [seekIndicator, setSeekIndicator] = useState<{ type: 'forward' | 'backward', trigger: number } | null>(null);

  const subtitles = streamData?.data?.subtitles || streamData?.subtitles || [];

  const handleTimeUpdate = () => {
    if (videoRef.current && !isSeeking) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(time, duration));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleProgressBarInteraction = (clientX: number) => {
    if (!progressContainerRef.current) return;
    const rect = progressContainerRef.current.getBoundingClientRect();
    const pos = (clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(pos * duration, duration));
    setCurrentTime(newTime);
    seekTo(newTime);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsSeeking(true);
    handleProgressBarInteraction(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isSeeking) {
      e.stopPropagation();
      handleProgressBarInteraction(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isSeeking) {
      e.stopPropagation();
      setIsSeeking(false);
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    const now = Date.now();
    const x = e.clientX;
    const timeDiff = now - lastTapRef.current.time;
    
    // Double tap within 300ms
    if (timeDiff < 300) {
      const windowWidth = window.innerWidth;
      resetControlsTimer();
      
      if (x < windowWidth / 2) {
        // Rewind 10s
        seekTo(currentTime - 10);
        setSeekIndicator({ type: 'backward', trigger: now });
      } else {
        // Forward 10s
        seekTo(currentTime + 10);
        setSeekIndicator({ type: 'forward', trigger: now });
      }
      
      // Prevent rapid tapping feeling weird
      lastTapRef.current = { time: 0, x: 0 };
    } else {
      lastTapRef.current = { time: now, x };
    }
  };

  return (
    <motion.div
      key="player"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full flex flex-col h-full bg-black z-50 absolute inset-0 md:relative"
      onClick={resetControlsTimer}
      onMouseMove={resetControlsTimer}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <AnimatePresence>
        {showPlayerControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-between p-4 pt-safe top-0 w-full z-20 absolute pointer-events-none"
          >
            <div className="flex items-center gap-2 drop-shadow-md">
               <span className="text-[10px] bg-amber-500/80 backdrop-blur-md px-2 py-1 rounded text-black font-bold uppercase tracking-widest pointer-events-auto">VIP</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setView('home'); }}
              className="flex items-center justify-center w-10 h-10 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors pointer-events-auto"
            >
              <X className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex-1 w-full h-full flex items-center justify-center relative overflow-hidden bg-[#0A0A0B]" onClickCapture={handleVideoClick}>
        {isLoadingStream ? (
          <div className="flex flex-col items-center gap-2 text-amber-500">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-white font-bold text-xs">Memuat...</span>
          </div>
        ) : getStreamUrl(streamData) ? (
          <>
            {isVideoFile(getStreamUrl(streamData)!) ? (
              <HlsPlayer 
                ref={videoRef}
                key={getStreamUrl(streamData)!}
                src={getStreamUrl(streamData)!}
                className="w-full h-full object-cover"
                loop={false}
                subtitles={subtitles}
                activeSubtitleIndex={activeSubtitleIndex}
                onClick={resetControlsTimer}
                onEnded={handleNextEpisode}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
              />
            ) : (
              <iframe 
                src={getStreamUrl(streamData)!} 
                className="w-full h-full border-0"
                allowFullScreen
                allow="autoplay; fullscreen"
              />
            )}
            
            <AnimatePresence>
              {seekIndicator && (
                <motion.div
                  key={seekIndicator.trigger}
                  initial={{ opacity: 1, scale: 0.8 }}
                  animate={{ opacity: 0, scale: 1.2 }}
                  transition={{ duration: 0.5 }}
                  className={`absolute top-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center justify-center z-20 ${
                    seekIndicator.type === 'forward' ? 'right-16 md:right-32' : 'left-16 md:left-32'
                  }`}
                  onAnimationComplete={() => setSeekIndicator(null)}
                >
                  <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white mb-2">
                    {seekIndicator.type === 'forward' ? <FastForward className="w-8 h-8"/> : <Rewind className="w-8 h-8"/>}
                  </div>
                  <span className="text-white font-bold drop-shadow-md">
                    {seekIndicator.type === 'forward' ? '+10s' : '-10s'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Overlay */}
            <AnimatePresence>
              {showPlayerControls && !showPlayerEpisodeList && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-0 left-0 right-0 pt-4 pb-8 md:pb-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end z-10 pointer-events-none"
                >
                  
                  <div className="flex items-end justify-between px-4 mb-4 pointer-events-auto w-full">
                    <div className="flex-1 pr-16 mb-2">
                      <h2 className="text-xl md:text-2xl font-bold text-white mb-2 drop-shadow-lg leading-tight">
                        {selectedDrama ? getTitle(selectedDrama) : 'Video'}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-white/80 drop-shadow-md mb-2">
                         {selectedDrama?.type && <span className="bg-amber-500 text-black px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">{selectedDrama.type}</span>}
                         <span>{currentEpisodeIndex >= 0 ? `Episode ${currentEpisodeIndex + 1}` : 'Sedang ditonton'}</span>
                      </div>
                      {selectedDrama?.description && (
                        <p className="text-xs text-white/70 line-clamp-2 drop-shadow-md">{selectedDrama.description}</p>
                      )}
                    </div>
                    
                    {(episodes.length > 1 || subtitles.length > 0 || getStreamUrl(streamData)) && (
                      <div className="absolute right-4 bottom-32 md:bottom-24 flex flex-col items-center gap-6 pointer-events-auto">
                         {getStreamUrl(streamData) && (
                           <a 
                             href={`/api/download?url=${encodeURIComponent(getStreamUrl(streamData)!)}&title=${encodeURIComponent(getTitle(streamData))}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             onClick={(e) => { e.stopPropagation(); }} 
                             className="flex flex-col items-center gap-1.5 group"
                           >
                             <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-lg group-hover:bg-amber-500 transition-colors">
                                <Download className="w-5 h-5" />
                             </div>
                             <span className="text-[10px] font-bold text-white drop-shadow-md">Download</span>
                           </a>
                         )}
                         {subtitles.length > 0 && (
                           <button onClick={(e) => { e.stopPropagation(); setShowSubtitleList(true); }} className="flex flex-col items-center gap-1.5 group">
                             <div className={`w-10 h-10 rounded-full backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-lg transition-colors ${activeSubtitleIndex >= 0 ? 'bg-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-black/40 group-hover:bg-amber-500'}`}>
                                <Type className="w-5 h-5" />
                             </div>
                             <span className="text-[10px] font-bold text-white drop-shadow-md">Subtitle</span>
                           </button>
                         )}
                         {episodes.length > 1 && (
                           <div className="flex flex-col items-center gap-1.5 mt-2">
                             <button onClick={(e) => { e.stopPropagation(); setShowPlayerEpisodeList(true); }} className="flex flex-col items-center gap-1 group">
                               <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-lg group-hover:bg-amber-500 transition-colors">
                                  <List className="w-5 h-5" />
                               </div>
                               <span className="text-[10px] font-bold text-white drop-shadow-md mt-1">Episode</span>
                             </button>
                             {duration > 0 && (
                               <span className="text-[10px] font-bold text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] px-2 py-0.5 rounded-full bg-black/40 border border-white/10">{formatTime(currentTime)} / {formatTime(duration)}</span>
                             )}
                           </div>
                         )}
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {isVideoFile(getStreamUrl(streamData)!) && duration > 0 && (
                    <div className="w-full px-4 mb-2 pointer-events-auto">
                      <div 
                        className="w-full h-8 flex items-center group cursor-pointer"
                        ref={progressContainerRef}
                        onPointerDown={handlePointerDown}
                      >
                        <div className="w-full h-1.5 bg-white/30 rounded-full relative overflow-hidden transition-all group-hover:h-2 group-hover:bg-white/40">
                          <div 
                            className="absolute top-0 left-0 bottom-0 bg-amber-500 rounded-full transition-all"
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
               {showPlayerEpisodeList && (
                 <motion.div
                   initial={{ opacity: 0, y: "100%" }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: "100%" }}
                   className="absolute bottom-0 right-0 sm:top-0 w-full sm:w-80 h-[80vh] sm:h-full bg-[#0A0A0B]/95 backdrop-blur-xl border-t sm:border-l sm:border-t-0 border-white/10 z-30 flex flex-col pointer-events-auto rounded-t-[32px] sm:rounded-none shadow-2xl pb-safe"
                   onClick={(e) => e.stopPropagation()}
                   onTouchStart={(e) => e.stopPropagation()}
                   onTouchEnd={(e) => e.stopPropagation()}
                   onWheel={(e) => e.stopPropagation()}
                 >
                   <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
                     <h3 className="font-bold text-white text-lg">Daftar Episode</h3>
                     <button 
                       onClick={() => setShowPlayerEpisodeList(false)}
                       className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-white"
                     >
                       <X className="w-5 h-5" />
                     </button>
                   </div>
                   <div className="flex-1 overflow-y-auto no-scrollbar p-4">
                     <div className="grid grid-cols-5 sm:grid-cols-4 gap-3">
                       {episodes.map((ep, idx) => {
                          const displayTitle = (idx + 1).toString();
                          const isActive = idx === currentEpisodeIndex;
                          return (
                            <button
                              key={`player-ep-${idx}`}
                              onClick={() => handlePlayEpisode(ep)}
                              className={`aspect-square rounded-2xl flex items-center justify-center text-sm font-bold transition-all border ${
                                isActive
                                  ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                  : 'bg-[#161618] text-slate-300 border-white/5 hover:border-amber-500/50 hover:bg-[#2A2A2D]'
                              }`}
                            >
                              {displayTitle}
                            </button>
                          );
                       })}
                     </div>
                   </div>
                 </motion.div>
               )}
            </AnimatePresence>

            <AnimatePresence>
               {showSubtitleList && (
                 <motion.div
                   initial={{ opacity: 0, y: "100%" }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: "100%" }}
                   className="absolute bottom-0 right-0 sm:top-0 w-full sm:w-80 h-[60vh] sm:h-full bg-[#0A0A0B]/95 backdrop-blur-xl border-t sm:border-l sm:border-t-0 border-white/10 z-30 flex flex-col pointer-events-auto rounded-t-[32px] sm:rounded-none shadow-2xl pb-safe"
                   onClick={(e) => e.stopPropagation()}
                   onTouchStart={(e) => e.stopPropagation()}
                   onTouchEnd={(e) => e.stopPropagation()}
                   onWheel={(e) => e.stopPropagation()}
                 >
                   <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
                     <h3 className="font-bold text-white text-lg">Pilih Subtitle</h3>
                     <button 
                       onClick={() => setShowSubtitleList(false)}
                       className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-white"
                     >
                       <X className="w-5 h-5" />
                     </button>
                   </div>
                   <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
                       <button
                         onClick={() => { setActiveSubtitleIndex(-1); setShowSubtitleList(false); }}
                         className={`w-full text-left px-5 py-4 rounded-2xl flex items-center justify-between transition-all border ${
                           activeSubtitleIndex === -1
                             ? 'bg-amber-500/10 text-amber-500 border-amber-500/50'
                             : 'bg-[#161618] text-slate-300 border-white/5 hover:border-amber-500/30'
                         }`}
                       >
                         <span className="font-bold">Mati (Off)</span>
                       </button>
                       {subtitles.map((sub: any, idx: number) => {
                          const isActive = idx === activeSubtitleIndex;
                          return (
                            <button
                              key={`sub-${idx}`}
                              onClick={() => { setActiveSubtitleIndex(idx); setShowSubtitleList(false); }}
                              className={`w-full text-left px-5 py-4 rounded-2xl flex items-center justify-between transition-all border ${
                                isActive
                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/50'
                                  : 'bg-[#161618] text-slate-300 border-white/5 hover:border-amber-500/30'
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
          </>
        ) : (
          <div className="text-slate-500 text-center space-y-4 p-6">
            <span className="text-4xl">🎬</span>
            <p className="font-bold text-white">Stream tidak tersedia.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-amber-500 text-black font-bold rounded-xl text-sm"
            >
              Muat Ulang
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
