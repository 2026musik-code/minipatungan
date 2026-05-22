import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Info, CheckCircle, Zap, MonitorSmartphone, Clock } from 'lucide-react';
import { getUserId } from '../userId';

export const ProfileView = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile', {
          headers: { 'X-User-ID': getUserId() }
        });
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpgrade = (plan: string) => {
    alert(`Fitur upgrade VIP ${plan} belum tersedia. Semua fitur di proyek ini akan diatur di halaman /admin.`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex-1 overflow-y-auto pb-24 no-scrollbar"
    >
      <div className="px-4 py-8 max-w-lg mx-auto">
        
        {/* Header Profile - Centered & Luxurious */}
        <div className="flex flex-col items-center justify-center pt-4 pb-8">
          <div className="relative">
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-amber-500/20 blur-[30px] rounded-full animate-pulse" />
            
            <div className="w-24 h-24 rounded-full border border-amber-500/30 p-1 relative z-10 bg-[#0A0A0B] shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#1A1A1A]">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile" className="w-full h-full object-cover" />
              </div>
            </div>
            
            <div className="absolute -bottom-1 -right-1 bg-[#121214] rounded-full p-1.5 border border-white/10 z-20 shadow-xl">
              <Shield className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          
          <h2 className="mt-5 text-2xl font-black text-white tracking-tight">{profile?.id || 'USER-0000'}</h2>
          
          <div className="mt-2 text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Free Member
          </div>
        </div>

        {/* Limit Status - Bento Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-[#121214]/80 backdrop-blur-md rounded-2xl border border-white/5 p-5 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-2">Limit Tontonan</span>
            {profile?.limit >= 999999 ? (
               <div className="text-2xl sm:text-3xl font-black text-amber-500 tracking-tighter mt-1 mb-1">TANPA BATAS</div>
            ) : (
               <div className="text-4xl font-black text-white tracking-tighter">{profile?.limit || 0}</div>
            )}
            <span className="text-amber-500 text-[10px] font-bold mt-1 uppercase">Tayangan / Hari</span>
          </div>
          <div className="bg-[#121214]/80 backdrop-blur-md rounded-2xl border border-white/5 p-5 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-2">Status Iklan</span>
            {profile?.type === 'VIP' ? (
              <div className="text-xl font-bold text-amber-500 mt-1 mb-2">Bebas Iklan</div>
            ) : (
              <div className="text-xl font-bold text-white mt-1 mb-2">Aktif</div>
            )}
            <span className="text-slate-400 text-[10px] font-medium mt-1">{profile?.type === 'VIP' ? 'Premium Member' : 'Upgrade untuk hapus'}</span>
          </div>
        </div>

        {/* VIP Upgrade Section */}
        <div className="space-y-4 mb-8">
           <div className="flex items-center justify-between px-1 mb-2">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                Paket VIP
             </h3>
           </div>
           
           <div className="grid gap-3">
              {/* Daily */}
              <div onClick={() => handleUpgrade('Harian')} className="group bg-[#121214] border border-white/5 hover:border-slate-400/30 p-5 rounded-2xl cursor-pointer transition-all relative overflow-hidden">
                 <div className="flex justify-between items-center mb-3">
                   <div className="flex items-center gap-2">
                     <Clock className="w-4 h-4 text-slate-400" />
                     <h4 className="text-white font-bold text-sm">Harian</h4>
                   </div>
                   <span className="text-base font-bold text-white">Rp 5.000</span>
                 </div>
                 <div className="flex items-center gap-4 border-t border-white/5 pt-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                       <CheckCircle className="w-3.5 h-3.5 text-slate-500" /> Limit +100
                    </div>
                 </div>
              </div>

              {/* Weekly */}
              <div onClick={() => handleUpgrade('Mingguan')} className="group bg-[#121214] border border-white/5 hover:border-amber-500/30 p-5 rounded-2xl cursor-pointer transition-all relative overflow-hidden">
                 <div className="flex justify-between items-center mb-3">
                   <div className="flex items-center gap-2">
                     <CrownIcon className="w-4 h-4 text-amber-500" />
                     <h4 className="text-white font-bold text-sm">Mingguan</h4>
                   </div>
                   <span className="text-base font-bold text-white">Rp 25.000</span>
                 </div>
                 <div className="flex items-center gap-4 border-t border-white/5 pt-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                       <CheckCircle className="w-3.5 h-3.5 text-amber-500" /> Limit +1000
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                       <CheckCircle className="w-3.5 h-3.5 text-amber-500" /> Tanpa Iklan
                    </div>
                 </div>
              </div>

              {/* Monthly (Luxurious) */}
              <div onClick={() => handleUpgrade('Bulanan')} className="group bg-gradient-to-b from-[#1E1910] to-[#121214] border border-amber-500/30 hover:border-amber-500 p-1 rounded-2xl cursor-pointer transition-all relative overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.05)]">
                 <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-black text-[10px] font-black tracking-widest uppercase rounded-bl-xl z-10">
                   Populer
                 </div>
                 <div className="bg-[#121214]/80 backdrop-blur-xl p-4 rounded-xl h-full border border-white/5 transition-colors group-hover:bg-[#121214]/60">
                   <div className="flex justify-between items-center mb-3 pr-16">
                     <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center">
                         <CrownIcon className="w-3 h-3 text-amber-500" />
                       </div>
                       <h4 className="text-amber-500 font-bold text-sm">Bulanan</h4>
                     </div>
                     <span className="text-lg font-black text-amber-500">Rp 75.000</span>
                   </div>
                   <div className="flex items-center gap-4 border-t border-amber-500/10 pt-3">
                      <div className="flex items-center gap-1.5 text-xs text-amber-100/70 font-medium">
                         <CheckCircle className="w-3.5 h-3.5 text-amber-500" /> Limit +5000
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-amber-100/70 font-medium">
                         <CheckCircle className="w-3.5 h-3.5 text-amber-500" /> Akses Penuh tanpa Iklan
                      </div>
                   </div>
                 </div>
              </div>
           </div>
        </div>

        {/* System Info / Device Details */}
        <div className="mt-10 pt-6 border-t border-white/5 space-y-4">
           <div className="flex items-center justify-between text-slate-500 mb-3 px-1">
             <span className="text-[10px] uppercase tracking-wider font-bold">Informasi Sistem</span>
             <MonitorSmartphone className="w-3.5 h-3.5" />
           </div>
           
           <div className="bg-[#0A0A0B] rounded-xl border border-white/5 p-4 space-y-3 font-mono text-[10px] text-slate-400">
             <div className="flex justify-between items-center">
               <span className="text-slate-600">IP Address</span>
               <span>{profile?.ip || 'Undetected'}</span>
             </div>
             <div className="flex flex-col gap-1">
               <span className="text-slate-600">User Agent</span>
               <span className="break-all text-slate-500 leading-relaxed">{profile?.userAgent || 'Undetected'}</span>
             </div>
           </div>
           
           <div className="flex gap-2 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-blue-400/80">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed">
                Manajemen layanan, limit limitasi, dan sistem transaksi VIP akan sepenuhnya dikonfigurasi melalui panel <strong>/admin</strong> untuk mengontrol hak akses seluruh akun secara terpusat.
              </p>
           </div>
        </div>

      </div>
    </motion.div>
  );
};

const CrownIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
);
