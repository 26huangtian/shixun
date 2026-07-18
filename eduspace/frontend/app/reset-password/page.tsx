"use client"
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) alert(error.message);
    else {
      alert('密码重置成功！');
      router.push('/login');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-4">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-[3rem] overflow-hidden p-10 animate-in fade-in duration-500">
        <h2 className="text-3xl font-black italic tracking-tighter text-slate-800">设置新密码</h2>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Set a secure credential</p>

        <form onSubmit={handleUpdate} className="mt-10 space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-500 uppercase ml-1">新密码</label>
            <input type="password" placeholder="请输入新密码" required
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button disabled={loading} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-black transition-all uppercase text-xs">
            {loading ? "更新中..." : "确认修改并登录"}
          </button>
        </form>
      </div>
    </div>
  );
}