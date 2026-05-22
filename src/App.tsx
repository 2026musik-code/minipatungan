import { useState, useEffect, FormEvent, useRef } from 'react';
import { Search, Play, Tv, ChevronLeft, X, LayoutGrid, Crown, Loader2, Sparkles, Popcorn, List, Film, Clapperboard, Video, MonitorPlay, PlayCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerView } from './components/PlayerView';
import { ProfileView } from './components/ProfileView';
import { AdminView } from './components/AdminView';
import { getUserId } from './userId';

const getProviderIcon = (id: string, className?: string) => {
  const seed = encodeURIComponent(id.toLowerCase());
  return <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=transparent`} alt={id} className={`object-contain ${className || 'w-4 h-4'}`} />;
};

// --- Types (Flexible to accommodate unknown API schemas) ---
type ViewState = 'home' | 'details' | 'player' | 'history' | 'profile';

export default function App() {
  if (window.location.pathname.startsWith('/admin')) {
    return <AdminView />;
  }

  const [view, setView] = useState<ViewState>('home');
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{provider: any, results: any[]}[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedDrama, setSelectedDrama] = useState<any | null>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);

  const [streamData, setStreamData] = useState<any | null>(null);
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(-1);
  const [showPlayerControls, setShowPlayerControls] = useState(true);
  const [showPlayerEpisodeList, setShowPlayerEpisodeList] = useState(false);
  const [showSubtitleList, setShowSubtitleList] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetControlsTimer = () => {
    setShowPlayerControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowPlayerControls(false);
    }, 3000);
  };

  useEffect(() => {
    if (view === 'player') {
      resetControlsTimer();
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [view]);

  const [trendingDramas, setTrendingDramas] = useState<any[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch Providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await fetch('/api/providers');
        const data: any = await res.json();
        
        let providerList: any[] = [];
        if (Array.isArray(data)) {
          providerList = data;
        } else if (data && data.data && Array.isArray(data.data)) {
          providerList = data.data;
        } else if (data && typeof data === 'object') {
          providerList = Object.keys(data).map(k => ({ id: k, name: data[k].name || k }));
        }

        const allowed = ['reelshort', 'netshort', 'freereels', 'dotdrama', 'stardusttv', 'meloshort'];
        const filteredProviders = providerList.filter(p => allowed.includes(String(p.id || p.name || p).toLowerCase()));
        
        setProviders(filteredProviders.length > 0 ? filteredProviders : allowed.map(id => ({ id, name: id.charAt(0).toUpperCase() + id.slice(1) })));
        
        if (filteredProviders.length > 0) {
          const defaultProv = filteredProviders.find(p => String(p.id | p.name | p).toLowerCase() === 'freereels') || filteredProviders[0];
          setSelectedProvider(defaultProv.id || defaultProv.name || defaultProv);
        } else {
          setSelectedProvider('freereels');
        }
      } catch (err) {
        // Fallback silently if providers fail to fetch (offline or server error)
        const allowed = ['reelshort', 'netshort', 'freereels', 'dotdrama', 'stardusttv', 'meloshort'];
        setProviders(allowed.map(id => ({ id, name: id.charAt(0).toUpperCase() + id.slice(1) })));
        setSelectedProvider('freereels');
      }
    };
    fetchProviders();
  }, []);

  // Fetch Trending
  useEffect(() => {
    if (!selectedProvider) return;
    const fetchTrending = async () => {
      setIsLoadingTrending(true);
      try {
        const res = await fetch(`/api/rank/${selectedProvider}`);
        const data: any = await res.json();
        if (Array.isArray(data)) setTrendingDramas(data);
        else if (data && Array.isArray(data.data)) setTrendingDramas(data.data);
        else if (data && Array.isArray(data.result)) setTrendingDramas(data.result);
        else setTrendingDramas([]);
      } catch (err: any) {
        console.error("Trending fetch error:", err.message || err);
        setTrendingDramas([]);
      } finally {
        setIsLoadingTrending(false);
      }
    };
    fetchTrending();
  }, [selectedProvider]);

  // 2. Search
  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || providers.length === 0) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      const resultsByProvider = await Promise.all(providers.map(async (provider) => {
        const val = provider.id || provider.name || provider;
        try {
          const res = await fetch(`/api/search/${val}?q=${encodeURIComponent(searchQuery)}`);
          const data: any = await res.json();
          let providerRes: any[] = [];
          if (Array.isArray(data)) {
            providerRes = data;
          } else if (data && Array.isArray(data.data)) {
            providerRes = data.data;
          } else if (data && Array.isArray(data.result)) {
            providerRes = data.result;
          }
          return { provider, results: providerRes };
        } catch (err) {
          console.error(`Search error for ${val}:`, err);
          return { provider, results: [] };
        }
      }));
      setSearchResults(resultsByProvider);
    } catch (err) {
      console.error("Search error group:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // 3. Select Drama -> Fetch Episodes
  const handleSelectDrama = async (drama: any, providerOverride?: string) => {
    const provToUse = providerOverride || selectedProvider;
    if (providerOverride) {
      setSelectedProvider(providerOverride);
    }
    setSelectedDrama(drama);
    setView('player'); // Go directly to player view
    setIsLoadingEpisodes(true);
    setIsLoadingStream(true); // Show loading overlay immediately
    setEpisodes([]);
    setStreamData(null);
    
    // Save to history
    const dramaToSave = { ...drama, _sourceProvider: provToUse };
    setHistory(prev => {
      const filtered = prev.filter(p => (p.id || p.title) !== (drama.id || drama.title));
      return [dramaToSave, ...filtered].slice(0, 20); // Keep last 20
    });
    
    // Attempt to get the ID
    const dramaId = drama.id || drama.fakeId || drama.videoFakeId || drama.link || drama.url;
    
    let episodeList: any[] = [];
    try {
      if (dramaId) {
        const res = await fetch(`/api/episodes/${provToUse}?id=${encodeURIComponent(dramaId)}`);
        const data: any = await res.json();
        
        if (Array.isArray(data)) episodeList = data;
        else if (data && Array.isArray(data.data)) episodeList = data.data;
        else if (data && Array.isArray(data.episodes)) episodeList = data.episodes;
      }
      
      if (episodeList.length === 0 && drama.episodes && Array.isArray(drama.episodes)) {
        episodeList = drama.episodes;
      }
      
      setEpisodes(episodeList);
    } catch (err) {
      console.error("Episodes error:", err);
    } finally {
      setIsLoadingEpisodes(false);
      // Auto-play first episode length > 0
      if (episodeList.length > 0) {
        handlePlayEpisode(episodeList[0], episodeList, provToUse);
      } else {
        // If no episodes, at least go to player with the drama itself as a dummy episode
        setEpisodes([drama]);
        handlePlayEpisode(drama, [drama], provToUse);
      }
    }
  };

  const handleBuyPackage = async (type: string, amount: number) => {
    setIsProcessingPayment(true);
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-ID': getUserId()
        },
        body: JSON.stringify({
          amount: amount,
          customer_name: "VIP User",
          customer_email: "vip@example.com"
        })
      });
      const data: any = await res.json();
      const paymentData = data.data || data; // Handle nested 'data' object commonly used by payment gateways
      const paymentInfo = paymentData.payment_info || {};

      const checkoutUrl = paymentData.pay_url || paymentData.checkout_url || paymentData.payment_url;

      if (checkoutUrl) {
         window.location.href = checkoutUrl;
      } else {
        const qrString = paymentInfo.qr_string || paymentData.qr_string;
        const qrUrl = paymentInfo.qr_url || paymentData.qr_url;

        if (qrString || qrUrl) {
          setQrCodeData({ qr_string: qrString, qr_url: qrUrl, checkout_url: checkoutUrl });
        } else {
          alert("Gagal membuat transaksi: " + (data.message || data.error || JSON.stringify(data)));
        }
      }
    } catch (err) {
      console.error("Payment error:", err);
      alert("Terjadi kesalahan koneksi saat membuat kode bayar.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // 4. Select Episode -> Fetch Stream
  const handlePlayEpisode = async (episode: any, episodeList?: any[], providerOverride?: string) => {
    // Check limit first
    try {
      const limitRes = await fetch('/api/consume-limit', { 
        method: 'POST',
        headers: { 'X-User-ID': getUserId() }
      });
      const limitData: any = await limitRes.json();
      if (!limitData.allowed) {
        setShowUpgradeModal(true);
        setIsLoadingStream(false);
        return;
      }
    } catch (err) {
      console.error("Failed to check limit", err);
    }

    setView('player');
    setIsLoadingStream(true);
    setStreamData(null);
    setShowPlayerEpisodeList(false);
    setShowSubtitleList(false);
    
    const currentList = episodeList || episodes;
    // Find index
    const idx = currentList.findIndex(ep => {
       const id1 = ep.videoFakeId || ep.fakeId || ep.id || ep.link || ep.url || ep.chapter_id || ep.chapterId || ep.videoUrl || ep.originalUrl;
       const id2 = episode.videoFakeId || episode.fakeId || episode.id || episode.link || episode.url || episode.chapter_id || episode.chapterId || episode.videoUrl || episode.originalUrl;
       if (!id1 || !id2) return false;
       return id1 === id2;
    });
    setCurrentEpisodeIndex(idx);
    
    // Determine episode ID
    const epId = episode.videoFakeId || episode.fakeId || episode.id || episode.link || episode.url || episode.chapter_id || episode.chapterId;
    const streamProvider = providerOverride || selectedProvider;
    
    // If we have a direct video URL and no proper episode ID to fetch stream, use it directly
    if (!epId && (episode.videoUrl || episode.originalUrl || typeof episode === 'string')) {
      setStreamData(episode);
      setIsLoadingStream(false);
      return;
    }
    
    try {
      const res = await fetch(`/api/stream/${streamProvider}?id=${encodeURIComponent(epId)}`);
      const data: any = await res.json();
      setStreamData(data);
    } catch (err) {
      console.error("Stream error:", err);
    } finally {
      setIsLoadingStream(false);
    }
  };

  const handleNextEpisode = () => {
    if (currentEpisodeIndex >= 0 && currentEpisodeIndex < episodes.length - 1) {
       handlePlayEpisode(episodes[currentEpisodeIndex + 1]);
    }
  };

  const handlePrevEpisode = () => {
    if (currentEpisodeIndex > 0) {
       handlePlayEpisode(episodes[currentEpisodeIndex - 1]);
    }
  };
  
  // Wheel and Touch handlers for Player
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (showPlayerEpisodeList || showSubtitleList) return;
    resetControlsTimer();
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (showPlayerEpisodeList || showSubtitleList) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    if (diff > 50) {
      handleNextEpisode();
    } else if (diff < -50) {
      handlePrevEpisode();
    }
  };
  const handleWheel = (e: React.WheelEvent) => {
    if (showPlayerEpisodeList || showSubtitleList) return;
    resetControlsTimer();
    if (e.deltaY > 50) {
      handleNextEpisode();
    } else if (e.deltaY < -50) {
      handlePrevEpisode();
    }
  };

  // UI Helpers
  const goBack = () => {
    if (view === 'player') setView('details');
    else if (view === 'details') setView('home');
  };

  // --- RENDERING ---

  // Helper to extract image
  const getImage = (item: any) => {
    return item.thumb || item.thumbnail || item.poster || item.cover || item.coverImgUrl || item.image || item.img || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  };
  
  // Helper to extract title
  const getTitle = (item: any) => {
    return item.title || item.chapter_name || item.name || item.judul || (item.episode ? `Episode ${item.episode}` : undefined) || 'Unknown Title';
  };

  // Helper to extract iframe or video URL
  const getRawStreamUrl = (data: any) => {
    if (!data) return null;
    if (typeof data === 'string') return data;
    if (data.data?.streams && Array.isArray(data.data.streams) && data.data.streams[0]?.url) return data.data.streams[0].url;
    if (data.streams && Array.isArray(data.streams) && data.streams[0]?.url) return data.streams[0].url;
    if (data.data?.url) return data.data.url;
    if (data.data?.videoUrl) return data.data.videoUrl;
    if (data.data?.link) return data.data.link;
    if (data.data?.iframe) return data.data.iframe;
    if (data.url) return data.url;
    if (data.videoUrl) return data.videoUrl;
    if (data.link) return data.link;
    if (data.file) return data.file;
    if (data.iframe) return data.iframe;
    if (Array.isArray(data) && data[0]?.url) return data[0].url;
    if (Array.isArray(data.data) && data.data[0]?.url) return data.data[0].url;
    
    // Fallback: Recursively look for a string starting with http and ending with m3u8/mp4, or just any http
    const _recursiveFindStr = (obj: any): string | null => {
      if (!obj || typeof obj !== 'object') return null;
      for (const val of Object.values(obj)) {
        if (typeof val === 'string' && val.startsWith('http') && (val.includes('.m3u8') || val.includes('.mp4'))) return val;
        if (typeof val === 'object') {
          const res = _recursiveFindStr(val);
          if (res) return res;
        }
      }
      return null;
    };
    
    const hlsUrl = _recursiveFindStr(data);
    if (hlsUrl) return hlsUrl;

    const maybeUrl = Object.values(data).find(v => typeof v === 'string' && v.startsWith('http'));
    return maybeUrl as string || null;
  };

  const getStreamUrl = (data: any) => {
    const url = getRawStreamUrl(data);
    if (!url) return undefined;
    
    const providerVal = selectedProvider;
    
    if (providerVal === 'freereels' && url.includes('.m3u8')) {
      const referer = data.data?.headers?.Referer || data.data?.streams?.[0]?.headers?.Referer || 'https://www.freereels.com/';
      const origin = data.data?.headers?.Origin || data.data?.streams?.[0]?.headers?.Origin || 'https://www.freereels.com';
      return `/api/proxy/m3u8?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(referer)}&origin=${encodeURIComponent(origin)}`;
    }
    
    return url;
  };

  const isVideoFile = (url: string | null) => {
    if (!url) return false;
    return url.includes('.m3u8') || url.includes('.mp4') || url.includes('vividshort.com') || url.includes('video.netshort.com') || url.includes('video.reelshort.com');
  };

  const bgImage = (view === 'details' || view === 'player') && selectedDrama 
    ? getImage(selectedDrama) 
    : (trendingDramas.length > 0 ? getImage(trendingDramas[0]) : null);

  return (
    <div className="h-screen bg-[#0A0A0B] text-slate-200 flex overflow-hidden font-sans selection:bg-amber-500/30 relative">
      {/* Dynamic Blurred Background */}
      {bgImage && (
        <div className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-1000 ease-in-out">
          <img src={bgImage} alt="background" className="w-full h-full object-cover opacity-[0.25] blur-[80px] scale-110" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0B]/40 via-[#0A0A0B]/80 to-[#0A0A0B]" />
        </div>
      )}

      {/* Sidebar Navigation */}
      {view !== 'player' && (
      <aside className="w-20 bg-[#121214]/80 backdrop-blur-md border-r border-white/5 flex-col items-center py-8 gap-10 hidden md:flex shrink-0 z-10 relative">
        <div 
          onClick={() => setView('home')}
          className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer"
        >
          <span className="text-black font-black text-xl">P</span>
        </div>
        <nav className="flex flex-col gap-8 text-slate-500 items-center">
          <div onClick={() => setView('home')} className={`transition-colors cursor-pointer ${view === 'home' ? 'text-amber-500' : 'hover:text-amber-500'}`}><Tv className="w-6 h-6" /></div>
          <div className="hover:text-amber-500 transition-colors cursor-pointer"><Search className="w-6 h-6" /></div>
          <div className="hover:text-amber-500 transition-colors cursor-pointer"><Crown className="w-6 h-6" /></div>
          <div className="hover:text-amber-500 transition-colors cursor-pointer"><LayoutGrid className="w-6 h-6" /></div>
        </nav>
        <div className="mt-auto">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-500 border border-white/10"></div>
        </div>
      </aside>
      )}

      {/* Main Content */}
      <main className={`flex-1 flex flex-col h-full overflow-hidden ${view === 'player' ? '' : 'pb-16 md:pb-0'} z-10 relative`}>
        {/* Header Area */}
        {view !== 'player' && (
        <div className="shrink-0 flex flex-col border-b border-white/5 bg-[#0A0A0B]/60 backdrop-blur-md z-10 transition-all">
          {/* Top Bar */}
          <header className="h-12 md:h-14 flex items-center justify-between px-4 md:px-10">
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-bold tracking-tight text-white cursor-pointer flex items-center gap-1.5" onClick={() => setView('home')}>
                <span className="w-5 h-5 bg-amber-500 rounded-[4px] flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.3)] text-black font-black text-xs">P</span>
                PATUNGAN<span className="text-amber-500">TV</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
               <button 
                 onClick={() => setShowUpgradeModal(true)}
                 className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-gradient-to-tr from-amber-500 to-[#0A0A0B] border border-amber-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-105 transition-transform"
               >
                  <Crown className="w-4 h-4 md:w-5 md:h-5 text-white" />
               </button>
            </div>
          </header>
          
          {/* Provider Selection Bar */}
          {view === 'home' && providers.length > 0 && (
            <div className="px-4 md:px-10 pb-2">
              <div className="flex overflow-x-auto no-scrollbar gap-2 items-center">
                {providers.map((p, i) => {
                  const val = p.id || p.name || p;
                  const name = p.name || p.id || p;
                  const display = typeof name === 'string' ? name.toUpperCase() : val;
                  const isActive = selectedProvider === val;
                  return (
                    <button
                      key={val + i}
                      onClick={() => setSelectedProvider(val)}
                      className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold text-[10px] tracking-wider transition-all border ${
                        isActive 
                          ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                          : 'bg-[#161618] text-slate-400 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {getProviderIcon(val, `w-3 h-3 ${isActive ? 'text-black' : 'text-amber-500'}`)}
                      {display}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative w-full">
          <AnimatePresence mode="wait">
            {view === 'home' && (
              <motion.div 
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col w-full pb-20"
              >
                {/* Search Bar */}
                <div className="px-4 mt-4">
                  <form onSubmit={handleSearch} className="relative w-full">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-slate-500" />
                    </div>
                    <input 
                      ref={searchInputRef}
                      type="text" 
                      placeholder="Cari video..."
                      className="w-full pl-10 pr-12 py-3 bg-[#1A1A1D]/80 backdrop-blur-md border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all text-white placeholder:text-slate-500 text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button 
                      type="submit"
                      disabled={isSearching || !searchQuery}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-amber-600 text-black font-bold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center shrink-0 hover:bg-amber-500"
                    >
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </button>
                  </form>
                </div>

                {/* Video Lists / Categories */}
                <div className="mt-3 pb-10">
                  {searchResults.some(g => g.results.length > 0) ? (
                    <div className="flex flex-col gap-6">
                      {searchResults.map((group, groupIdx) => group.results.length > 0 && (
                        <div key={`search-group-${groupIdx}`} className="px-4">
                          <div className="flex items-center gap-2 mb-3">
                             <div className="bg-[#161618] px-3 py-1.5 rounded-lg border border-amber-500/30 flex items-center gap-2 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                                {getProviderIcon(group.provider.id || group.provider.name || group.provider, "w-4 h-4 text-amber-500")}
                                <h3 className="text-sm font-bold text-amber-500 tracking-tight capitalize">
                                   {group.provider.name || group.provider.id || group.provider}
                                </h3>
                             </div>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 pb-2">
                            {group.results.map((item, idx) => (
                              <div
                                key={`search-${item.id || item.fakeId || item.videoFakeId || idx}-${idx}`}
                                onClick={() => handleSelectDrama(item, group.provider.id || group.provider.name || group.provider)}
                                className="w-full group relative rounded-xl overflow-hidden cursor-pointer bg-[#161618] border border-white/5 hover:border-amber-500/50 transition-all shadow-md"
                              >
                                <div className="aspect-[2/3] overflow-hidden relative">
                                  <img src={getImage(item)} alt={getTitle(item)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                                    <div className="w-10 h-10 rounded-full bg-amber-500 text-black flex items-center justify-center">
                                      <Play className="w-4 h-4 ml-1" />
                                    </div>
                                  </div>
                                  <div className="absolute top-2 left-2 flex gap-1">
                                     {(item.type || item.category) && (
                                       <span className="bg-black/60 backdrop-blur-md text-amber-500 border border-white/10 text-[8px] font-bold px-1.5 py-0.5 rounded capitalize">
                                         {item.category || item.type}
                                       </span>
                                     )}
                                  </div>
                                </div>
                                <div className="p-3">
                                  <h4 className="font-bold text-white text-[11px] leading-snug line-clamp-2">{getTitle(item)}</h4>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !isSearching && searchQuery ? (
                    <div className="px-4 text-center py-6 text-slate-500 border border-white/5 rounded-xl bg-[#121214]/60 backdrop-blur-md">
                      <Popcorn className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Tidak ada hasil ditemukan.</p>
                    </div>
                  ) : isLoadingTrending ? (
                    <div className="flex justify-center py-6 text-amber-500">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : trendingDramas.length > 0 ? (
                    <div className="px-4">
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 pb-2">
                        {trendingDramas.map((item, idx) => (
                          <div
                            key={`grid-${item.id || item.videoFakeId || idx}-${idx}`}
                            onClick={() => handleSelectDrama(item)}
                            className="w-full group relative rounded-xl overflow-hidden cursor-pointer bg-[#161618] border border-white/5 hover:border-amber-500/50 transition-all shadow-md"
                          >
                            <div className="aspect-[2/3] overflow-hidden relative">
                              <img src={getImage(item)} alt={getTitle(item)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                                <div className="w-10 h-10 rounded-full bg-amber-500 text-black flex items-center justify-center">
                                  <Play className="w-4 h-4 ml-1" />
                                </div>
                              </div>
                              <div className="absolute top-2 left-2 flex gap-1 flex-wrap pr-2">
                                 {(item.type || item.category || item.quality) && (
                                   <span className="bg-black/60 backdrop-blur-md text-amber-500 border border-white/10 text-[8px] font-bold px-1.5 py-0.5 rounded capitalize">
                                     {item.quality || item.category || item.type}
                                   </span>
                                 )}
                              </div>
                            </div>
                            <div className="p-2">
                              <h4 className="font-bold text-white text-[10px] leading-snug line-clamp-2 group-hover:text-amber-500 transition-colors">{getTitle(item)}</h4>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 text-center py-6 text-slate-500 border border-white/5 rounded-xl bg-[#121214]/60 backdrop-blur-md">
                      <Popcorn className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Koleksi belum tersedia.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}



            {view === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full mx-auto pb-20 px-4 py-6"
              >
                <div className="flex items-center gap-2 mb-6">
                  <Crown className="w-6 h-6 text-amber-500" />
                  <h2 className="text-xl font-bold text-white">Riwayat Tontonan</h2>
                </div>

                {history.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {history.map((item, idx) => (
                      <div 
                        key={`hist-${item.id || item.videoFakeId || idx}-${idx}`}
                        className="flex gap-4 p-3 bg-[#121214]/60 backdrop-blur-md border border-white/5 rounded-xl cursor-pointer hover:border-amber-500/50 transition-colors"
                        onClick={() => handleSelectDrama(item, item._sourceProvider)}
                      >
                        <div className="w-24 aspect-[2/3] md:aspect-video rounded-lg overflow-hidden shrink-0 relative">
                          <img src={getImage(item)} alt={getTitle(item)} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Play className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h4 className="font-bold text-white text-sm line-clamp-2">{getTitle(item)}</h4>
                          <div className="flex items-center gap-2 mt-2">
                             {(item.type || item.category) && (
                               <span className="bg-amber-500 text-black px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">{item.category || item.type}</span>
                             )}
                             <span className="text-slate-500 text-[10px]">Pernah ditonton</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-500 bg-[#121214]/60 backdrop-blur-md rounded-2xl border border-white/5 flex flex-col items-center">
                    <Popcorn className="w-12 h-12 mb-4 opacity-30" />
                    <p>Belum ada riwayat tontonan.</p>
                  </div>
                )}
              </motion.div>
            )}

            {view === 'profile' && (
              <ProfileView key="profile" />
            )}

            {view === 'player' && (
              <PlayerView
                isLoadingStream={isLoadingStream}
                streamData={streamData}
                selectedDrama={selectedDrama}
                episodes={episodes}
                currentEpisodeIndex={currentEpisodeIndex}
                showPlayerControls={showPlayerControls}
                showPlayerEpisodeList={showPlayerEpisodeList}
                setShowPlayerEpisodeList={setShowPlayerEpisodeList}
                showSubtitleList={showSubtitleList}
                setShowSubtitleList={setShowSubtitleList}
                resetControlsTimer={resetControlsTimer}
                handleTouchStart={handleTouchStart}
                handleTouchEnd={handleTouchEnd}
                handleWheel={handleWheel}
                handleNextEpisode={handleNextEpisode}
                setView={setView}
                handlePlayEpisode={handlePlayEpisode}
                getTitle={getTitle}
                getStreamUrl={getStreamUrl}
                isVideoFile={isVideoFile}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        {view !== 'player' && (
        <div className="fixed sm:relative bottom-0 w-full h-16 bg-[#0A0A0B]/80 backdrop-blur-md border-t border-white/5 flex items-center justify-around px-2 z-40 pb-safe">
          <button onClick={() => { setView('home'); setSearchQuery(''); setSearchResults([]); }} className={`flex flex-col items-center gap-1 ${view === 'home' ? 'text-amber-500' : 'text-slate-500'}`}>
             <Tv className="w-5 h-5" />
             <span className="text-[10px] font-bold">Beranda</span>
          </button>
          <button onClick={() => { setView('home'); searchInputRef.current?.focus(); }} className="flex flex-col items-center gap-1 text-slate-500 hover:text-amber-500">
             <Search className="w-5 h-5" />
             <span className="text-[10px] font-bold">Cari</span>
          </button>
          <button onClick={() => setView('history')} className={`flex flex-col items-center gap-1 ${view === 'history' ? 'text-amber-500' : 'text-slate-500'}`}>
             <Crown className="w-5 h-5" />
             <span className="text-[10px] font-bold">Riwayat</span>
          </button>
          <button onClick={() => setView('profile')} className={`flex flex-col items-center gap-1 ${view === 'profile' ? 'text-amber-500' : 'text-slate-500 hover:text-amber-500'}`}>
             <div className={`w-5 h-5 rounded-full overflow-hidden ${view === 'profile' ? 'border border-amber-500' : ''}`}>
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile" className="w-full h-full object-cover" />
             </div>
             <span className="text-[10px] font-bold">Profil</span>
          </button>
        </div>
        )}

  {/* Upgrade Modal */}
        <AnimatePresence>
          {showUpgradeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
              onClick={() => setShowUpgradeModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-b from-[#1a1400] to-[#0A0A0B] border border-amber-500/20 rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.1)]"
              >
                <div className="relative pt-10 pb-6 px-6 text-center">
                  <button 
                    onClick={() => setShowUpgradeModal(false)}
                    className="absolute top-4 right-4 p-2 bg-black/50 text-slate-400 hover:text-white rounded-full hover:bg-black/80 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="mx-auto w-24 h-24 rounded-full border border-amber-500/30 p-2 bg-gradient-to-tr from-amber-500/10 to-transparent flex items-center justify-center shadow-[inset_0_0_20px_rgba(245,158,11,0.2)] mb-4 relative">
                    <div className="absolute inset-0 bg-amber-500/10 rounded-full animate-pulse"></div>
                    <Crown className="w-12 h-12 text-amber-500 relative z-10 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                  </div>
                  <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-600 drop-shadow-sm font-sans tracking-tight">VIP Premium</h3>
                  <p className="text-sm text-amber-200/60 mt-2 font-medium">Buka limit tanpa batas, nikmati dengan kualitas terbaik.</p>
                </div>
                
                <div className="px-6 pb-8 space-y-4">
                  {qrCodeData ? (
                    <div className="space-y-5 text-center mt-2">
                       <div className="bg-white p-5 rounded-2xl mx-auto w-max shadow-[0_0_40px_rgba(255,255,255,0.15)] ring-4 ring-amber-500/20">
                          <img src={qrCodeData.qr_url || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCodeData.qr_string || qrCodeData.checkout_url || 'https://paymenku.com')}`} alt="QR Code" className="w-48 h-48 sm:w-56 sm:h-56 object-contain" />
                       </div>
                       <p className="text-sm text-slate-300 font-medium">Silakan Scan QRIS ini dengan<br/>E-Wallet atau M-Banking Anda.</p>
                       <button onClick={() => setQrCodeData(null)} className="w-full bg-[#121214] border border-white/10 hover:border-amber-500/50 hover:bg-[#1A1A1C] text-white font-bold py-3.5 rounded-xl transition-colors">Batalkan / Kembali</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* VIP AKSES */}
                      <div className="bg-gradient-to-tr from-amber-500/20 to-amber-600/5 border border-amber-500/50 rounded-3xl p-6 relative overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.15)] text-left hover:shadow-[0_0_50px_rgba(245,158,11,0.25)] transition-all">
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-[10px] font-black px-4 py-1.5 rounded-bl-2xl tracking-widest shadow-md uppercase">Eksklusif</div>
                        
                        <h4 className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-600 font-extrabold text-2xl drop-shadow-sm mb-1 mt-1">Akses VIP</h4>
                        <div className="flex items-baseline gap-2 mb-6">
                           <span className="text-3xl font-black text-white">Rp 5.000</span>
                           <span className="text-sm font-medium text-amber-200/60">/ 30 Hari</span>
                        </div>
                        
                        <div className="space-y-3 mb-8 bg-black/20 rounded-xl p-4 border border-white/5">
                           <div className="flex items-center gap-3 text-sm text-slate-300">
                              <div className="bg-amber-500/20 p-1 rounded-full"><CheckCircle className="w-4 h-4 text-amber-500" /></div>
                              <span>Jenis Akun: <strong className="text-amber-400">VIP Premium</strong></span>
                           </div>
                           <div className="flex items-center gap-3 text-sm text-slate-300">
                              <div className="bg-amber-500/20 p-1 rounded-full"><CheckCircle className="w-4 h-4 text-amber-500" /></div>
                              <span>Limit: <strong className="text-amber-400">Tanpa Batas</strong></span>
                           </div>
                        </div>

                        <button onClick={() => handleBuyPackage('vip_30', 5000)} disabled={isProcessingPayment} className="w-full bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-400 hover:to-amber-500 text-black text-sm font-extrabold px-6 py-4 rounded-xl transition-all shadow-[0_4px_20px_rgba(245,158,11,0.4)] hover:shadow-[0_6px_25px_rgba(245,158,11,0.6)] hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2">
                           {isProcessingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Beli Akses VIP <Crown className="w-4 h-4" /></>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
