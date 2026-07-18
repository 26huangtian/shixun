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
      // 1. 获取当前登录会话
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      setUserEmail(session.user.email || '');

      // 2. 携带令牌请求后端真实统计数据
      try {
        const res = await fetch('/api/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!res.ok) {
           throw new Error('后端响应不成功');
        }

        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("加载 Dashboard 数据失败:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // 退出登录逻辑
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // 加载中状态显示
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">正在连接图书云端...</p>
      </div>
    );
  }

  return (
    // 主容器：使用浅色背景 bg-slate-50，消除黑色压抑感
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 space-y-10 animate-in fade-in duration-700">
      
      {/* 1. 顶部欢迎横幅：蓝紫渐变色系 */}
      <section className="relative p-10 rounded-[3rem] overflow-hidden shadow-2xl shadow-indigo-100">
        {/* 渐变背景 */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600"></div>
        
        <div className="relative z-10 flex justify-between items-start text-white">
          <div>
            <h2 className="text-4xl font-black tracking-tighter italic">
              你好, {stats?.real_name || userEmail.split('@')[0]} <span className="not-italic">📖</span>
            </h2>
            <p className="mt-2 text-blue-100 font-bold uppercase tracking-[0.2em] text-xs opacity-90">
                {stats?.role === 'admin' ? '系统管理员权限已激活' : '数字化图书借阅平台'}
            </p>
          </div>
          
          {/* 安全退出按钮：半透明磨砂质感 */}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-white/20 active:scale-95 shadow-lg"
          >
            <span>🚪</span> 安全退出系统
          </button>
        </div>

        {/* 装饰性背景球 */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
      </section>

      {/* 2. 读者个人状态区 (所有角色共有) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 借阅统计卡片 */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">我的借阅概览</h3>
            <span className="text-xl">📚</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-7xl font-black text-indigo-600">{stats?.my_stats?.borrowing || 0}</span>
            <span className="text-slate-400 font-bold uppercase text-xs">Books active</span>
          </div>
          <button 
            onClick={() => router.push('/dashboard/books')}
            className="mt-8 w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
          >
            浏览图书馆藏 →
          </button>
        </div>

        {/* 到期提醒卡片 */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">待还提醒</h3>
            <span className="text-xl">⏰</span>
          </div>
          {stats?.my_stats?.due_soon_book ? (
            <div className="space-y-3">
              <p className="text-2xl font-black text-slate-800 tracking-tight leading-tight">《{stats.my_stats.due_soon_book}》</p>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse"></span>
                <p className="text-orange-500 font-black text-xs italic">
                  将在 {stats.my_stats.due_date} 到期，请按时归还
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center opacity-30">
               <span className="text-4xl">🍃</span>
               <p className="text-[10px] font-black uppercase tracking-widest mt-3">暂无即期还书任务</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. 管理员管理视窗 (仅当角色为 admin 时显示) */}
      {stats?.role === 'admin' && (
        <section className="pt-6 space-y-8 animate-in slide-in-from-bottom-10 duration-1000">
          <div className="flex items-center gap-4 px-6">
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] whitespace-nowrap">全馆实时监控系统</h3>
            <div className="h-[1px] w-full bg-slate-200/50"></div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <AdminStatCard title="图书总量" value={stats.admin_stats?.total_books} color="text-blue-600" icon="📦" />
            <AdminStatCard title="活跃读者" value={stats.admin_stats?.total_readers} color="text-indigo-600" icon="👥" />
            <AdminStatCard title="当前借出" value={stats.admin_stats?.active_borrows} color="text-purple-600" icon="♻️" />
            <AdminStatCard title="库存预警" value={stats.admin_stats?.low_stock_count} color="text-orange-500" icon="⚠️" />
          </div>

          {/* 底部快捷入口：深蓝黑色风格，体现后台的稳重感 */}
          <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white flex flex-col md:flex-row justify-between items-center relative overflow-hidden shadow-2xl">
             <div className="relative z-10 space-y-4">
                <h4 className="text-3xl font-black italic tracking-tighter">后台智慧管理枢纽</h4>
                <p className="text-slate-400 text-sm font-medium max-w-lg leading-relaxed">
                    管理员专区已开放：支持图书批量入库、借阅历史追溯及逾期罚金处理等核心管控功能。
                </p>
             </div>
             <button 
                onClick={() => router.push('/dashboard/admin/inventory')}
                className="relative z-10 mt-10 md:mt-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-12 py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
             >
                进入管理控制台
             </button>
             {/* 极淡的紫色背景装饰 */}
             <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          </div>
        </section>
      )}
    </div>
  );
}

// 内部组件：管理员统计小卡片
function AdminStatCard({ title, value, color, icon }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl transition-all duration-500">
      <div className="flex justify-between items-start mb-6">
        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{title}</span>
        <span className="text-lg grayscale opacity-40">{icon}</span>
      </div>
      <p className={`text-5xl font-black tracking-tighter ${color} mb-2`}>{value || 0}</p>
      <div className="w-8 h-1.5 bg-slate-100 rounded-full"></div>
    </div>
  );
}