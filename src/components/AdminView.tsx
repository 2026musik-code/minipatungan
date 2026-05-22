import { useState } from 'react';
import { Shield, Users, Crown, Settings, CreditCard, MessageSquare, Image as ImageIcon, Save, Key, Lock, Phone, Send, Trash2, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminView = () => {
  const [activeTab, setActiveTab] = useState<'users-free' | 'users-vip' | 'pricing' | 'popup' | 'security' | 'payment'>('users-free');

  // Dummy state
  const [freeUsers, setFreeUsers] = useState([
    { id: 'USER-1021', ip: '192.168.1.1', limit: 100 },
    { id: 'USER-3498', ip: '114.120.45.2', limit: 50 },
  ]);

  const [vipUsers, setVipUsers] = useState([
    { id: 'USER-9921', ip: '10.0.0.1', limit: 5000, type: 'Bulanan', exp: '2026-06-21' },
    { id: 'USER-8812', ip: '10.0.0.9', limit: 1200, type: 'Mingguan', exp: '2026-05-28' },
  ]);

  const [pricing, setPricing] = useState({ daily: 5000, weekly: 25000, monthly: 75000 });
  const [popup, setPopup] = useState({ text: 'Limit harian Anda telah habis. Upgrade ke VIP untuk akses tanpa batas dan tanpa iklan!', image: '', wa: '6281234567890', tg: 'patungantv_admin' });
  const [security, setSecurity] = useState({ oldPass: '', newPass: '', confirmPass: '' });
  const [payment, setPayment] = useState({ apiKey: 'sk_test_seryG3U0IrU56SzFIczQuZ4ycA5iWJ6H' });
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleUpdateFreeLimit = (id: string, limit: number) => {
    setFreeUsers(freeUsers.map(u => u.id === id ? { ...u, limit } : u));
    showToast(`Limit ${id} diperbarui`);
  };

  const handleUpdateVipLimit = (id: string, limit: number) => {
    setVipUsers(vipUsers.map(u => u.id === id ? { ...u, limit } : u));
    showToast(`Limit VIP ${id} diperbarui`);
  };

  const handleDeleteVip = (id: string) => {
    setVipUsers(vipUsers.filter(u => u.id !== id));
    showToast(`User ${id} dihapus`);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0A0A0B] text-slate-200 font-sans selection:bg-amber-500/30">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-4 left-1/2 z-50 bg-[#121214] border border-amber-500/50 text-white px-4 py-3 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center gap-3"
          >
            <Check className="w-5 h-5 text-amber-500" />
            <span className="font-medium text-sm">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#121214]/80 backdrop-blur-xl border-r border-white/5 flex flex-col pt-6 z-20 shrink-0">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <Shield className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-white font-black tracking-tight leading-tight">Admin<span className="text-amber-500">Panel</span></h1>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">PatunganTV</p>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 md:space-y-1 no-scrollbar pb-6 flex flex-row md:flex-col gap-2 overflow-x-auto w-full border-b md:border-b-0 border-white/5 md:pb-6 pb-4">
          <div className="flex md:block gap-2 w-max md:w-full px-1">
          {[
            { id: 'users-free', icon: Users, label: 'User Free' },
            { id: 'users-vip', icon: Crown, label: 'User VIP' },
            { id: 'pricing', icon: CreditCard, label: 'Harga VIP' },
            { id: 'popup', icon: MessageSquare, label: 'Notif & Kontak' },
            { id: 'payment', icon: Key, label: 'API Payment' },
            { id: 'security', icon: Lock, label: 'Keamanan' },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-max md:w-full flex items-center gap-2 md:gap-3 px-4 md:px-4 py-2 md:py-3 rounded-xl transition-all font-medium text-sm md:text-base border ${
                  active 
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                  : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 md:w-5 md:h-5 ${active ? 'text-amber-500' : 'text-slate-500'}`} />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            )
          })}
          </div>
          
          {/* Back to App */}
          <div className="hidden md:block w-px md:w-full md:mt-8 h-8 md:h-auto border-l md:border-l-0 md:border-t border-white/10 mx-2 md:mx-0 md:pt-4" />
          <a href="/" className="md:w-full flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl transition-all font-medium text-sm md:text-base text-slate-400 border border-transparent hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 w-max">
             <AlertCircle className="w-4 h-4 md:w-5 md:h-5 opacity-70" />
             <span className="whitespace-nowrap">Keluar</span>
          </a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#0A0A0B] relative">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/10 via-[#0A0A0B] to-[#0A0A0B] pointer-events-none" />
         
         <div className="relative z-10 max-w-4xl mx-auto p-4 md:p-8 space-y-6">
            
            <motion.div 
               key={activeTab}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.3 }}
            >
              
              {/* TAB: FREE USERS */}
              {activeTab === 'users-free' && (
                <div className="space-y-6">
                   <div>
                     <h2 className="text-2xl font-bold text-white mb-1">Manajemen User Free</h2>
                     <p className="text-slate-400 text-sm">Atur limit akses untuk pengguna gratis.</p>
                   </div>
                   
                   <div className="grid gap-4">
                     {freeUsers.map((user) => (
                       <div key={user.id} className="bg-[#121214]/80 backdrop-blur-md rounded-2xl border border-white/5 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-white/[0.02] shadow-sm hover:border-white/10">
                         {/* User Info */}
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                             <Users className="w-5 h-5 text-slate-400" />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-white font-bold text-base">{user.id}</span>
                             <span className="text-slate-500 text-xs font-mono bg-black/30 px-2 py-0.5 rounded w-fit mt-1">{user.ip}</span>
                           </div>
                         </div>
                         
                         {/* Controls */}
                         <div className="flex items-center gap-3 w-full md:w-auto bg-black/30 md:bg-transparent p-3 md:p-0 rounded-xl border border-white/5 md:border-transparent">
                           <div className="flex-1 md:flex-none flex items-center gap-2">
                             <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider md:hidden">Limit:</span>
                             <input 
                               type="number" 
                               defaultValue={user.limit}
                               className="w-full md:w-28 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-center md:text-left focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono text-white"
                               onBlur={(e) => handleUpdateFreeLimit(user.id, parseInt(e.target.value) || 0)}
                             />
                           </div>
                           <button 
                              onClick={() => showToast(`Limit ${user.id} disimpan`)}
                              className="bg-amber-500/10 hover:bg-amber-500 hover:text-black text-amber-500 px-4 py-2 rounded-lg border border-amber-500/30 hover:border-amber-500 transition-all flex items-center gap-2 text-sm font-bold shrink-0 shadow-sm"
                           >
                             <Save className="w-4 h-4" /> <span className="hidden md:inline">Simpan</span>
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              )}

              {/* TAB: VIP USERS */}
              {activeTab === 'users-vip' && (
                <div className="space-y-6">
                   <div>
                     <h2 className="text-2xl font-bold text-white mb-1">Manajemen User VIP</h2>
                     <p className="text-slate-400 text-sm">Kelola data pelanggan premium, limit, dan hapus pelanggan.</p>
                   </div>
                   
                   <div className="grid gap-4">
                     {vipUsers.map((user) => (
                       <div key={user.id} className="bg-[#121214]/80 backdrop-blur-md rounded-2xl border border-amber-500/20 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-white/[0.02] shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:border-amber-500/40 relative overflow-hidden">
                         <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-black tracking-widest px-2 py-0.5 rounded-bl-lg uppercase">{user.type}</div>
                         
                         <div className="flex items-center gap-4 mt-2 md:mt-0">
                           <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30 shrink-0 shadow-inner">
                             <Crown className="w-6 h-6 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-white font-bold text-lg leading-tight">{user.id}</span>
                             <div className="flex flex-wrap items-center gap-2 mt-1">
                               <span className="text-slate-500 text-xs font-mono bg-black/30 px-2 py-0.5 rounded">{user.ip}</span>
                               <span className="text-amber-500/80 text-[10px] font-bold border border-amber-500/20 px-1.5 py-0.5 rounded bg-amber-500/5 uppercase">Exp: {user.exp}</span>
                             </div>
                           </div>
                         </div>
                         
                         <div className="flex items-center gap-3 w-full md:w-auto bg-black/30 md:bg-transparent p-3 md:p-0 rounded-xl border border-white/5 md:border-transparent mt-2 md:mt-0">
                           <div className="flex-1 md:flex-none flex items-center gap-2">
                             <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider md:hidden">Sisa Limit:</span>
                             <input 
                               type="number" 
                               defaultValue={user.limit}
                               className="w-full md:w-28 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-center md:text-left focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono text-white"
                               onBlur={(e) => handleUpdateVipLimit(user.id, parseInt(e.target.value) || 0)}
                             />
                           </div>
                           <div className="flex items-center gap-2 shrink-0">
                             <button 
                                onClick={() => showToast(`Perubahan ${user.id} disimpan`)}
                                className="bg-amber-500/10 hover:bg-amber-500 hover:text-black text-amber-500 p-2.5 rounded-lg border border-amber-500/30 transition-all flex items-center justify-center shadow-sm"
                             >
                               <Save className="w-5 h-5" />
                             </button>
                             <button 
                                onClick={() => handleDeleteVip(user.id)}
                                className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 p-2.5 rounded-lg border border-red-500/30 transition-all flex items-center justify-center shadow-sm"
                             >
                               <Trash2 className="w-5 h-5" />
                             </button>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              )}

              {/* TAB: PRICING */}
              {activeTab === 'pricing' && (
                <div className="space-y-6">
                   <div>
                     <h2 className="text-2xl font-bold text-white mb-1">Pengaturan Harga VIP</h2>
                     <p className="text-slate-400 text-sm">Sesuaikan harga paket berlangganan harian, mingguan, dan bulanan.</p>
                   </div>
                   
                   <div className="bg-[#121214]/80 backdrop-blur-md rounded-2xl border border-white/5 p-6 space-y-6">
                      <div className="grid md:grid-cols-3 gap-6">
                        
                        <div className="space-y-3">
                          <label className="text-sm font-bold text-slate-300">Harga Harian</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                            <input 
                              type="number" 
                              value={pricing.daily}
                              onChange={(e) => setPricing({...pricing, daily: parseInt(e.target.value) || 0})}
                              className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono text-white text-lg"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-bold text-slate-300">Harga Mingguan</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                            <input 
                              type="number" 
                              value={pricing.weekly}
                              onChange={(e) => setPricing({...pricing, weekly: parseInt(e.target.value) || 0})}
                              className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono text-white text-lg"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-bold text-slate-300">Harga Bulanan</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                            <input 
                              type="number" 
                              value={pricing.monthly}
                              onChange={(e) => setPricing({...pricing, monthly: parseInt(e.target.value) || 0})}
                              className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono text-white text-lg"
                            />
                          </div>
                        </div>

                      </div>

                      <div className="flex justify-end pt-4 border-t border-white/5">
                        <button onClick={() => showToast('Harga berhasil disimpan')} className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-xl transition-colors shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center gap-2">
                          <Save className="w-5 h-5" /> Simpan Harga
                        </button>
                      </div>
                   </div>
                </div>
              )}

              {/* TAB: POPUP & CONTACT */}
              {activeTab === 'popup' && (
                <div className="space-y-6">
                   <div>
                     <h2 className="text-2xl font-bold text-white mb-1">Popup Notifikasi & Kontak</h2>
                     <p className="text-slate-400 text-sm">Teks yang muncul saat limit tercapai beserta kontak bantuan.</p>
                   </div>
                   
                   <div className="bg-[#121214]/80 backdrop-blur-md rounded-2xl border border-white/5 p-6 space-y-6">
                      
                      {/* Teks Limit */}
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-300">Teks Popup Limit</label>
                        <textarea 
                          value={popup.text}
                          onChange={(e) => setPopup({...popup, text: e.target.value})}
                          rows={3}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all text-white resize-none"
                        />
                      </div>

                      {/* Image Upload */}
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-300">Gambar Popup URL</label>
                        <div className="flex gap-4 items-center">
                          <div className="flex-1 relative">
                            <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input 
                              type="text" 
                              placeholder="URL Gambar (opsional)"
                              value={popup.image}
                              onChange={(e) => setPopup({...popup, image: e.target.value})}
                              className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all text-white"
                            />
                          </div>
                          {popup.image && (
                            <img src={popup.image} alt="Preview" className="w-12 h-12 rounded object-cover border border-white/20" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500">Masukkan link gambar (opsional) untuk menghiasi popup limit.</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-white/5 mt-4">
                        <div className="space-y-3">
                          <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                             <Phone className="w-4 h-4 text-green-500" /> 
                             WhatsApp Admin
                          </label>
                          <input 
                            type="text" 
                            value={popup.wa}
                            onChange={(e) => setPopup({...popup, wa: e.target.value})}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono text-white"
                            placeholder="628xxx"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                             <Send className="w-4 h-4 text-blue-400" /> 
                             Telegram Admin
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">@</span>
                            <input 
                              type="text" 
                              value={popup.tg}
                              onChange={(e) => setPopup({...popup, tg: e.target.value})}
                              className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono text-white"
                              placeholder="username"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-6">
                        <button onClick={() => showToast('Notifikasi & Kontak berhasil disimpan')} className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-xl transition-colors shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center gap-2">
                          <Save className="w-5 h-5" /> Simpan Pengaturan
                        </button>
                      </div>
                   </div>
                </div>
              )}

              {/* TAB: PAYMENT API */}
              {activeTab === 'payment' && (
                <div className="space-y-6">
                   <div>
                     <h2 className="text-2xl font-bold text-white mb-1">API Key Payment</h2>
                     <p className="text-slate-400 text-sm">Konfigurasi kunci pembayaran dan gateway.</p>
                   </div>
                   
                   <div className="bg-[#121214]/80 backdrop-blur-md rounded-2xl border border-white/5 p-6 space-y-6">
                      
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-300">Payment Gateway Secret Key</label>
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                          <input 
                            type="password" 
                            value={payment.apiKey}
                            onChange={(e) => setPayment({...payment, apiKey: e.target.value})}
                            className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-4 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono text-white"
                            placeholder="sk_..."
                          />
                        </div>
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-blue-200">
                         <AlertCircle className="w-5 h-5 shrink-0 text-blue-400" />
                         <p className="text-sm leading-relaxed">
                           Key ini digunakan untuk memvalidasi pembayaran otomatis dan mengkonversi transaksi sukses menjadi limit akun. Pastikan tidak bocor ke pihak lain.
                         </p>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button 
                          onClick={async () => {
                             try {
                               await fetch('/api/admin/settings', {
                                 method: 'POST',
                                 headers: { 'Content-Type': 'application/json' },
                                 body: JSON.stringify({ paymenku_api_key: payment.apiKey })
                               });
                               showToast('API Key disimpan');
                             } catch (err) {
                               showToast('Gagal menyimpan API Key');
                             }
                          }} 
                          className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-xl transition-colors shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center gap-2"
                        >
                          <Save className="w-5 h-5" /> Simpan Key
                        </button>
                      </div>
                   </div>
                </div>
              )}

              {/* TAB: SECURITY / ADMIN PASSWORD */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                   <div>
                     <h2 className="text-2xl font-bold text-white mb-1">Keamanan Admin</h2>
                     <p className="text-slate-400 text-sm">Ubah kata sandi untuk akses halaman admin.</p>
                   </div>
                   
                   <div className="bg-[#121214]/80 backdrop-blur-md rounded-2xl border border-white/5 p-6 space-y-6 max-w-xl">
                      
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-300">Sandi Lama</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                          <input 
                            type="password" 
                            value={security.oldPass}
                            onChange={(e) => setSecurity({...security, oldPass: e.target.value})}
                            className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono text-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <label className="text-sm font-bold text-slate-300">Sandi Baru</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                          <input 
                            type="password" 
                            value={security.newPass}
                            onChange={(e) => setSecurity({...security, newPass: e.target.value})}
                            className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono text-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-300">Konfirmasi Sandi Baru</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                          <input 
                            type="password" 
                            value={security.confirmPass}
                            onChange={(e) => setSecurity({...security, confirmPass: e.target.value})}
                            className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono text-white"
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button 
                           onClick={() => {
                             if(security.newPass !== security.confirmPass) {
                               alert('Konfirmasi sandi tidak cocok!'); return;
                             }
                             showToast('Sandi Admin berhasil diubah');
                             setSecurity({ oldPass: '', newPass: '', confirmPass: '' });
                           }} 
                           className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-xl transition-colors shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center gap-2"
                        >
                          <Save className="w-5 h-5" /> Ubah Sandi
                        </button>
                      </div>
                   </div>
                </div>
              )}

            </motion.div>
         </div>
      </main>

    </div>
  );
};
