"use client"
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert('登录失败: ' + error.message);
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-4 font-sans">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-500">
        
        {/* 顶部蓝色区域 */}
        <div className="bg-indigo-600 p-8 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-3 text-2xl shadow-inner">📖</div>
            <h1 className="text-3xl font-black tracking-tighter italic">BookSpace<span className="not-italic">.</span></h1>
            <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-90">数字化图书管理平台</p>
          </div>
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        {/* 表单区域 */}
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">邮箱地址 / Email</label>
            <input 
              type="email" 
              placeholder="请输入您的邮箱" 
              required
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">访问密码 / Password</label>
            <input 
              type="password" 
              placeholder="请输入密码" 
              required
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            disabled={loading} 
            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all uppercase text-xs tracking-widest"
          >
            {loading ? "验证中..." : "立即登录系统"}
          </button>

          <div className="flex justify-between items-center px-1">
            <Link href="/register" className="text-xs font-black text-indigo-600 hover:text-indigo-800 underline underline-offset-4">注册新读者</Link>
            <Link href="#" className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors">忘记密码？</Link>
          </div>
        </form>
      </div>
    </div>
  );
}