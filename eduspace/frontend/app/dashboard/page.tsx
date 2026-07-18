"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function BookSpaceDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      try {
        const res = await fetch('/api/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("加载失败", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
      
      {/* 欢迎头部 */}
      <section className="relative p-10 rounded-[3rem] overflow-hidden text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-600"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-black tracking-tighter italic">
            你好, {stats?.real_name} <span className="not-italic">📖</span>
          </h2>
          <p className="mt-2 text-blue-100 font-medium opacity-80 uppercase tracking-widest text-xs">
            {stats?.role === 'admin' ? '系统管理员权限已激活' : '欢迎来到您的数字图书馆'}
          </p>
        </div>
        {/* 背景装饰球 */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </section>

      {/* 第一部分：作为读者的个人概览 (用户和管理都能看到) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] shadow-sm border border-white">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">当前借阅状态</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black text-indigo-600">{stats?.my_stats?.borrowing || 0}</span>
            <span className="text-slate-400 font-bold">本在读</span>
          </div>
          <button onClick={() => router.push('/dashboard/my-books')} className="mt-6 text-indigo-600 font-black text-xs uppercase hover:underline">查看借阅清单 →</button>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] shadow-sm border border-white">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">还书提醒</h3>
          {stats?.my_stats?.due_soon_book ? (
            <div>
              <p className="text-lg font-black text-slate-800 line-clamp-1">《{stats.my_stats.due_soon_book}》</p>
              <p className="text-orange-500 font-bold text-xs mt-2 italic">将在 {stats.my_stats.due_date} 到期</p>
            </div>
          ) : (
            <p className="text-slate-300 italic text-sm">暂无临期书籍</p>
          )}
        </div>
      </div>

      {/* 第二部分：管理员专属看板 (仅管理员可见) */}
      {stats?.role === 'admin' && (
        <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-1000">
          <div className="flex items-center gap-3">
            <div className="h-[1px] flex-1 bg-slate-200"></div>
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">全馆管理视窗</h3>
            <div className="h-[1px] flex-1 bg-slate-200"></div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <AdminStatCard title="图书总量" value={stats.admin_stats.total_books} icon="📚" color="text-blue-600" />
            <AdminStatCard title="注册读者" value={stats.admin_stats.total_readers} icon="👥" color="text-indigo-600" />
            <AdminStatCard title="活跃借阅" value={stats.admin_stats.active_borrows} icon="♻️" color="text-purple-600" />
            <AdminStatCard title="库存预警" value={stats.admin_stats.low_stock_count} icon="⚠️" color="text-orange-500" />
          </div>

          <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex justify-between items-center">
             <div>
                <h4 className="text-xl font-black italic">快捷后台操作</h4>
                <p className="text-slate-400 text-xs mt-1">您可以直接进行图书入库、损耗登记或逾期处理</p>
             </div>
             <button onClick={() => router.push('/dashboard/admin/inventory')} className="bg-indigo-500 px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 transition-all">
                进入库存中心
             </button>
          </div>
        </section>
      )}
    </div>
  );
}

function AdminStatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:scale-105 transition-transform">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{title}</span>
        <span className="text-xl opacity-50">{icon}</span>
      </div>
      <p className={`text-4xl font-black tracking-tighter ${color}`}>{value || 0}</p>
    </div>
  );
}