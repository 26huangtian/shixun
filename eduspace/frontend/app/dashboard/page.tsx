"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function BookSpaceDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      setUserEmail(session.user.email || '');

      try {
        const res = await fetch('/api/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("加载数据失败:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  if (loading) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* 1. 顶部欢迎横幅 */}
      <section className="relative p-10 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-indigo-100">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
        <div className="relative z-10 flex justify-between items-start text-white">
          <div>
            <h2 className="text-4xl font-black tracking-tighter italic">你好, {stats?.real_name || userEmail.split('@')[0]} 👋</h2>
            <p className="mt-2 text-indigo-100 font-bold uppercase tracking-widest text-[10px] opacity-80">
                {stats?.role === 'admin' ? 'Administrator • 系统主控模式' : 'Reader • 个人学业书库'}
            </p>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} 
            className="bg-white/10 backdrop-blur-md px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 transition-all border border-white/10 active:scale-95">
            🚪 登出
          </button>
        </div>
      </section>

      {/* 2. 逾期罚金红色预警 (仅在有逾期时显示) */}
      {stats?.overdue_info?.has_overdue && (
        <div className="bg-red-50 border-2 border-red-100 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-red-500 rounded-3xl flex items-center justify-center text-3xl shadow-xl shadow-red-200">⚠️</div>
            <div>
              <h4 className="text-red-600 font-black uppercase tracking-tight text-xl italic">检测到借阅逾期</h4>
              <p className="text-red-400 text-xs font-bold mt-1">
                共有 {stats.overdue_info.count} 本书超期，累计罚金：
                <span className="text-red-600 text-lg font-black ml-2 font-mono">¥{stats.overdue_info.total_fine.toFixed(2)}</span>
              </p>
            </div>
          </div>
          <button onClick={() => router.push('/dashboard/my-books')} className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95">
            立即去还书
          </button>
        </div>
      )}

      {/* 3. 核心统计卡片 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 借阅数 */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-50 flex flex-col justify-between group hover:shadow-xl transition-all">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">当前在读</h3>
            <span className="text-xl">📚</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-8xl font-black text-indigo-600 tracking-tighter">{stats?.my_stats?.borrowing || 0}</span>
            <span className="text-slate-400 font-bold uppercase text-xs italic tracking-widest">Books</span>
          </div>
          <button onClick={() => router.push('/dashboard/books')} className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all">
             前往书库浏览
          </button>
        </div>

        {/* 阅读挑战进度 (环形图) */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-50 flex items-center justify-between group hover:shadow-xl transition-all">
           <div className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">本月阅读挑战</h3>
              <p className="text-2xl font-black text-slate-800 tracking-tighter italic">
                已读 {stats?.challenge?.current} / {stats?.challenge?.goal} 本
              </p>
              <p className="text-[10px] text-indigo-500 font-bold uppercase underline decoration-indigo-100 decoration-2 underline-offset-4">
                 距离目标还剩 {stats?.challenge?.goal - stats?.challenge?.current} 本
              </p>
           </div>
           <div className="relative w-28 h-28">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-50" />
                <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" fill="transparent" 
                  strokeDasharray={301}
                  strokeDashoffset={301 - (301 * (stats?.challenge?.percent || 0)) / 100}
                  className="text-indigo-600 transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-black text-slate-800">{stats?.challenge?.percent}%</span>
              </div>
           </div>
        </div>

        {/* 临期提醒 */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-50 flex flex-col justify-between group hover:shadow-xl transition-all">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">最近待还</h3>
            <span className="text-xl">⏰</span>
          </div>
          {stats?.my_stats?.due_soon_book ? (
            <div className="space-y-3">
              <p className="text-2xl font-black text-slate-800 tracking-tight leading-tight line-clamp-2 uppercase">《{stats.my_stats.due_soon_book}》</p>
              <p className="text-orange-500 font-black text-xs italic tracking-widest">将在 {stats.my_stats.due_date} 到期</p>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center opacity-20">
               <span className="text-4xl">🍃</span>
               <p className="text-[10px] font-black uppercase tracking-widest mt-4">暂无超期风险</p>
            </div>
          )}
          <button onClick={() => router.push('/dashboard/my-books')} className="mt-8 text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">查看详细档案 →</button>
        </div>
      </div>

      {/* 4. 管理员全馆监控 (Conditional) */}
      {stats?.role === 'admin' && (
        <section className="pt-10 space-y-8 animate-in slide-in-from-bottom-10 duration-1000">
          <div className="flex items-center gap-6 px-4 text-slate-300 font-black text-[11px] uppercase tracking-[0.5em]">
             <span>全馆实时监控</span>
             <div className="h-[1px] flex-1 bg-slate-100"></div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">总图书种类</span>
                <p className="text-5xl font-black text-blue-600 mt-2 tracking-tighter">{stats.admin_stats?.total_books}</p>
             </div>
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">活跃读者数</span>
                <p className="text-5xl font-black text-indigo-600 mt-2 tracking-tighter">{stats.admin_stats?.total_readers}</p>
             </div>
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">全馆借出中</span>
                <p className="text-5xl font-black text-purple-600 mt-2 tracking-tighter">{stats.admin_stats?.active_borrows}</p>
             </div>
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">库存预警</span>
                <p className="text-5xl font-black text-red-500 mt-2 tracking-tighter">{stats.admin_stats?.low_stock_count}</p>
             </div>
          </div>
        </section>
      )}
    </div>
  );
}