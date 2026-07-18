"use client"
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) alert(error.message);
    else setMessage('重置链接已发送！请检查您的邮箱。');
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-4">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-[2.5rem] overflow-hidden p-10 animate-in fade-in zoom-in duration-500">
        <h2 className="text-3xl font-black italic tracking-tighter text-slate-800 text-center">找回密码</h2>
        <p className="text-slate-400 text-[10px] font-bold uppercase text-center tracking-widest mt-2">Security Recovery</p>

        {message ? (
          <div className="mt-8 p-6 bg-green-50 rounded-3xl text-center">
            <p className="text-green-600 font-bold text-sm">{message}</p>
            <Link href="/login" className="inline-block mt-4 text-xs font-black text-indigo-600 underline">返回登录</Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="mt-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase ml-1">注册邮箱</label>
              <input type="email" placeholder="请输入您的邮箱" required
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button disabled={loading} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all uppercase text-xs">
              {loading ? "发送中..." : "发送重置链接"}
            </button>
            <div className="text-center">
              <Link href="/login" className="text-xs font-bold text-slate-400 hover:text-indigo-600">想起密码了？去登录</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}