"use client"
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string>('reader'); 
  const [loading, setLoading] = useState(true);
  const [academicInfo, setAcademicInfo] = useState({ year: '', semester: '', fullDate: '' });

  useEffect(() => {
    const checkUserAndRole = async () => {
      // 1. 检查会话状态
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // 2. 从后端 API 获取用户详细角色（对应 profiles 表中的 role）
      try {
        const res = await fetch('/api/me', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRole(data.role || 'reader');
        }
      } catch (err) {
        console.error("角色同步失败:", err);
      } finally {
        setLoading(false);
      }
    };

    // 3. 获取并计算真实的日期和学期
    const getRealTimeInfo = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      let semester = "";
      if (month >= 2 && month <= 6) semester = "春季学期";
      else if (month >= 7 && month <= 8) semester = "夏季学期";
      else if (month >= 9 && month <= 1) semester = "秋季学期";
      else semester = "秋季学期";

      const fullDate = now.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });

      setAcademicInfo({ year: year.toString(), semester, fullDate });
    };

    checkUserAndRole();
    getRealTimeInfo();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // --- 定义各角色的中文导航菜单 ---
  const getNavItems = () => {
    const homeItem = { name: '控制台首页', href: '/dashboard', icon: '🏠' };
    const profileItem = { name: '个人资料设置', href: '/dashboard/profile', icon: '⚙️' };

    // 读者端功能
    const readerItems = [
      homeItem,
      { name: '在线书库', href: '/dashboard/books', icon: '🏛️' },
      { name: '我的借阅', href: '/dashboard/my-books', icon: '🔖' },
{ name: '我的收藏', href: '/dashboard/wishlist', icon: '💖' },
{ name: '今日荐书', href: '/dashboard/recommend', icon: '✨' },
      profileItem,
    ];

    // 管理端功能
    const adminItems = [
      homeItem,
{ name: '我的收藏', href: '/dashboard/wishlist', icon: '💖' },
      { name: '图书入库', href: '/dashboard/admin/inventory', icon: '📦' },
      { name: '借阅审核', href: '/dashboard/admin/records', icon: '⚖️' },
      { name: '读者权限管理', href: '/dashboard/admin/users', icon: '👥' },
      profileItem,
    ];

    return role === 'admin' ? adminItems : readerItems;
  };

  const navItems = getNavItems();

  // 加载中动画：蓝紫风格
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <div className="animate-pulse text-indigo-600 font-black text-sm italic tracking-[0.3em]">正在进入系统...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      
      {/* 侧边导航栏 */}
      <aside className="w-72 bg-white border-r border-slate-200/60 hidden lg:flex flex-col sticky top-0 h-screen z-40 shadow-[20px_0_40px_rgba(0,0,0,0.01)]">
        
        {/* Logo 及身份标识 */}
        <div className="p-8 pb-4">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:rotate-6 transition-transform duration-300">
                  <span className="text-white text-xl">📖</span>
              </div>
              <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tighter italic">BookSpace<span className="text-indigo-600 not-italic">.</span></h2>
                  <div className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-md uppercase tracking-wider inline-block">
                    {role === 'admin' ? '系统管理员' : '尊享读者'}
                  </div>
              </div>
            </Link>
        </div>
        
        {/* 菜单导航 */}
        <nav className="flex-1 px-6 mt-8 space-y-2 overflow-y-auto">
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">功能目录</p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center px-4 py-4 rounded-2xl transition-all duration-300 group relative ${
                  isActive 
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 font-bold' 
                  : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                <span className={`mr-3 text-xl transition-all duration-300 ${isActive ? 'scale-110' : 'opacity-70 group-hover:scale-110 group-hover:opacity-100'}`}>
                  {item.icon}
                </span>
                <span className="text-[14px] tracking-tight">{item.name}</span>
                {isActive && (
                    <div className="absolute right-4 w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_8px_#818cf8]"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* 底部安全退出按钮 */}
        <div className="p-6">
          <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-slate-50 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-300 font-bold text-xs group border border-slate-100 shadow-sm"
          >
              <span className="text-lg group-hover:rotate-12 transition-transform">🚪</span>
              安全退出系统
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* 顶部 Header */}
        <header className="h-24 bg-white/60 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-12 sticky top-0 z-30">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-1">导航路径</span>
              <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
                {navItems.find(i => i.href === pathname)?.name || '系统中心'}
              </h1>
            </div>
            
            <div className="flex items-center gap-8">
                {/* 动态显示的真实年份与学期 */}
                <div className="hidden md:flex flex-col text-right border-r border-slate-200 pr-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">当前时段</p>
                  <p className="text-sm font-black text-slate-800 tracking-tight">
                    {academicInfo.year}年 <span className="text-indigo-600">{academicInfo.semester}</span>
                  </p>
                </div>

                {/* 用户头像与在线标识 */}
                <div className="flex items-center gap-4 group cursor-pointer">
                    <div className="flex flex-col text-right hidden sm:block">
                        <p className="text-xs font-black text-slate-800 leading-none">欢迎回来</p>
                        <p className="text-[9px] font-bold text-green-500 mt-1 uppercase tracking-tighter animate-pulse">● 实时在线模式</p>
                    </div>
                    <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black shadow-xl shadow-indigo-100 transition-transform duration-300 group-hover:scale-105 uppercase">
                          {role.charAt(0)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                    </div>
                </div>
            </div>
        </header>

        {/* 实时日期提示栏 */}
        <div className="px-12 pt-6">
            <div className="bg-indigo-50/50 border border-indigo-100 px-6 py-2 inline-flex items-center rounded-full shadow-sm">
                <span className="text-[10px] font-black text-indigo-400 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                   {academicInfo.fullDate}
                </span>
            </div>
        </div>

        {/* 子页面渲染区域 */}
        <div className="flex-1 px-12 py-6">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}