import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Hls from 'hls.js';

export interface Subtitle {
  label: string;
  lang: string;
  url: string;
  headers?: any;
}

interface HlsPlayerProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  loop?: boolean;
  autoPlay?: boolean;
  onClick?: () => void;
  onEnded?: () => void;
  subtitles?: Subtitle[];
  activeSubtitleIndex?: number;
  onTimeUpdate?: (e: any) => void;
  onLoadedMetadata?: (e: any) => void;
}

export const HlsPlayer = forwardRef<HTMLVideoElement, HlsPlayerProps>(({ src, className, style, loop = true, autoPlay = true, onClick, onEnded, subtitles = [], activeSubtitleIndex = -1, onTimeUpdate, onLoadedMetadata }, ref) => {
  const innerRef = useRef<HTMLVideoElement>(null);
  
  useImperativeHandle(ref, () => innerRef.current!);

  const [isPlaying, setIsPlaying] = useState(true);

  const togglePlay = () => {
    if (innerRef.current) {
      if (innerRef.current.paused) {
         const playPromise = innerRef.current.play();
         if (playPromise !== undefined) {
           playPromise.catch(e => {
             if (e.name !== 'AbortError') {
               console.error('Play error:', e);
             }
           });
         }
         setIsPlaying(true);
      } else {
         innerRef.current.pause();
         setIsPlaying(false);
      }
    }
  };

  useEffect(() => {
    const video = innerRef.current;
    if (!video) return;

    // reset state
    setIsPlaying(autoPlay);

    let hls: Hls | null = null;
    
    if (src.includes('.m3u8') && Hls.isSupported()) {
      hls = new Hls({ maxBufferLength: 30, enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              if (e.name !== 'AbortError') {
                console.log('Autoplay blocked:', e);
                setIsPlaying(false);
              }
            });
          }
        }
      });
    } else {
      // Native support (Safari / iOS) or direct mp4/webm file
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        if (autoPlay) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
             playPromise.catch(e => {
               if (e.name !== 'AbortError') {
                 console.log('Autoplay blocked:', e);
                 setIsPlaying(false);
               }
             });
          }
        }
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
    };
  }, [src, autoPlay]);

  useEffect(() => {
    if (innerRef.current) {
      const tracks = innerRef.current.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = i === activeSubtitleIndex ? 'showing' : 'hidden';
      }
    }
  }, [activeSubtitleIndex, subtitles]);

  return (
    <div className="relative w-full h-full cursor-pointer" onClick={() => { togglePlay(); if (onClick) onClick(); }}>
      <video 
        ref={innerRef} 
        className={className} 
        style={style} 
        playsInline 
        loop={loop} 
        onEnded={onEnded}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
      >
        {subtitles.map((sub, idx) => (
          <track
            key={idx}
            kind="subtitles"
            src={`/api/proxy/vtt?url=${encodeURIComponent(sub.url)}`}
            srcLang={sub.lang || sub.label.toLowerCase()}
            label={sub.label}
            default={idx === activeSubtitleIndex}
          />
        ))}
      </video>
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10 pointer-events-none">
          <div className="w-16 h-16 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white/80">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      )}
    </div>
  );
});
