"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  // --- 基础资料状态 ---
  const [name, setName] = useState('');
  const [userClass, setUserClass] = useState('');
  const [role, setRole] = useState('reader');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- 修改密码状态 ---
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwUpdating, setPwUpdating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setUserId(session.user.id);

      try {
        const res = await fetch('/api/me', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const data = await res.json();
        
        // 核心修复：使用 || '' 避免 null 传给 input 导致 React 报错
        setName(data.name || '');
        setUserClass(data.user_class || '');
        setRole(data.role || 'reader');
      } catch (err) {
        console.error("获取个人资料失败", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // --- 处理基本资料保存 ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    try {
        const res = await fetch('/api/me', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}` 
            },
            body: JSON.stringify({ name, user_class: userClass })
          });
          
          if (res.ok) alert('基本资料已成功同步至图书云端！');
    } finally {
        setSaving(false);
    }
  };

  // --- 处理密码修改 ---
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }
    if (newPassword.length < 6) {
      alert('为了安全，密码长度不能少于 6 位');
      return;
    }

    setPwUpdating(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      alert('更新失败: ' + error.message);
    } else {
      alert('安全凭据已更新！下次登录请使用新密码。');
      setNewPassword('');
      setConfirmPassword('');
    }
    setPwUpdating(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* 顶部标题区 */}
      <div className="flex justify-between items-end px-4">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic">个人中心 <span className="not-italic">⚙️</span></h2>
          <p className="text-slate-400 text-sm mt-1 font-medium italic uppercase tracking-widest">Identity & Security Settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 左侧：资料设置 (占 7 列) */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 relative overflow-hidden">
             {/* 角色标签 */}
             <div className="absolute top-8 right-8">
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  role === 'admin' ? 'bg-slate-900 text-white' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  {role === 'admin' ? '系统管理员' : '正式读者'}
                </span>
             </div>

             <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2">
                <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                基本资料维护
             </h3>

             <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">真实姓名 / Full Name</label>
                  <input 
                    type="text" required
                    className="w-full p-5 bg-slate-50 border-none rounded-[1.5rem] font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                    value={name} onChange={e => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {role === 'admin' ? '管理备注 / Admin Note' : '所属班级 / Academic Class'}
                  </label>
                  <input 
                    type="text" 
                    placeholder={role === 'admin' ? "系统主控员" : "如：计算机2201班"}
                    className="w-full p-5 bg-slate-50 border-none rounded-[1.5rem] font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                    value={userClass} onChange={e => setUserClass(e.target.value)}
                  />
                </div>

                <button 
                  disabled={saving}
                  className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all uppercase text-xs tracking-widest"
                >
                  {saving ? '正在同步云端...' : '保存更改并更新'}
                </button>
             </form>
          </div>

          {/* 电子借书证 (只有读者可见) */}
          {role === 'reader' && (
            <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="text-2xl font-black italic tracking-tight">BookSpace 电子借书证</h4>
                            <p className="text-slate-500 text-[10px] font-bold mt-1 uppercase">Digital Reader Pass</p>
                        </div>
                        <div className="text-3xl opacity-20 group-hover:opacity-100 transition-opacity">📶</div>
                    </div>

                    <div className="mt-12 space-y-4">
                        <div className="space-y-1">
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">识别码 / Reader ID</p>
                            <code className="text-indigo-400 font-mono text-sm tracking-tighter">{userId}</code>
                        </div>
                        <div className="flex gap-10">
                            <div>
                                <p className="text-[9px] text-slate-500 font-bold uppercase">持证人</p>
                                <p className="font-black text-lg">{name || '新读者'}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-500 font-bold uppercase">有效状态</p>
                                <p className="font-black text-lg text-green-400">ACTIVE</p>
                            </div>
                        </div>
                    </div>
                </div>
                {/* 背景装饰图案 */}
                <div className="absolute right-[-20px] bottom-[-20px] text-9xl opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-700 select-none">🔖</div>
            </div>
          )}
        </div>

        {/* 右侧：安全设置 (占 5 列) */}
        <div className="lg:col-span-5">
           <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-orange-100/50 relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
              
              <h3 className="text-xl font-black text-slate-800 mb-10 flex items-center gap-2 relative z-10">
                <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
                安全与隐私
              </h3>

              <form onSubmit={handleUpdatePassword} className="space-y-8 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">设置新密码</label>
                  <input 
                    type="password" required placeholder="••••••••"
                    className="w-full p-5 bg-orange-50/30 border-none rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">确认新密码</label>
                  <input 
                    type="password" required placeholder="••••••••"
                    className="w-full p-5 bg-orange-50/30 border-none rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>

                <button 
                  disabled={pwUpdating}
                  className="w-full py-5 bg-orange-500 text-white font-black rounded-3xl shadow-xl shadow-orange-100 hover:bg-orange-600 active:scale-95 transition-all uppercase text-xs tracking-widest"
                >
                  {pwUpdating ? '正在重置密钥...' : '更新账户密码'}
                </button>
              </form>

              <div className="mt-12 p-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                 <p className="text-[10px] text-slate-400 font-bold leading-relaxed italic">
                   * 修改密码后，您的登录状态将保持有效。系统建议定期更新密码以保障个人借阅历史与个人资料的安全。
                 </p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}