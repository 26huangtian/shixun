"use client"
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('reader'); 
  const [adminCode, setAdminCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (role === 'admin' && adminCode !== 'ADMIN888') {
      alert('校验码错误');
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, role: role } }
    });
    if (error) { alert('失败: ' + error.message); setLoading(false); } 
    else { alert('注册成功！'); router.push('/'); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-4 font-sans">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="bg-indigo-600 p-8 text-center text-white">
          <h2 className="text-2xl font-black italic tracking-tighter italic">创建您的账户</h2>
          <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mt-1">Join BookSpace Center</p>
        </div>

        {/* 角色切换 */}
        <div className="flex p-1.5 bg-slate-100 rounded-2xl mx-8 mt-6 border border-slate-200">
            <button type="button" onClick={() => setRole('reader')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${role === 'reader' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                读者 / Reader
            </button>
            <button type="button" onClick={() => setRole('admin')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${role === 'admin' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400'}`}>
                管理员 / Admin
            </button>
        </div>

        <form onSubmit={handleRegister} className="p-8 pt-4 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">真实姓名</label>
            <input type="text" placeholder="输入您的姓名" required
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
              value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">电子邮箱</label>
            <input type="email" placeholder="example@email.com" required
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">设置密码</label>
            <input type="password" placeholder="至少6位数字或字母" required
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {role === 'admin' && (
            <div className="animate-in zoom-in duration-300 space-y-1">
               <label className="text-[10px] font-black text-orange-600 uppercase ml-1">管理员邀请码</label>
               <input type="text" placeholder="请输入内部校验码" required
                className="w-full px-5 py-4 rounded-2xl border-2 border-orange-100 bg-orange-50 text-orange-700 placeholder:text-orange-300 focus:border-orange-500 outline-none transition-all font-bold"
                value={adminCode} onChange={(e) => setAdminCode(e.target.value)} />
            </div>
          )}

          <button disabled={loading} className={`w-full py-4 mt-4 rounded-2xl text-white font-black shadow-xl transition-all active:scale-95 uppercase text-xs tracking-widest ${role === 'admin' ? 'bg-slate-900 shadow-slate-200' : 'bg-indigo-600 shadow-indigo-100'}`}>
            {loading ? "同步中..." : "确认注册身份"}
          </button>

          <p className="text-center text-[10px] text-slate-400 font-bold uppercase mt-4">
            已有账号？ <Link href="/login" className="text-indigo-600 hover:underline">立即返回登录</Link>
          </p>
        </form>
      </div>
    </div>
  );
}