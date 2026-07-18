"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      // 1. 获取 Supabase 的当前会话
      const { data: { session } } = await supabase.auth.getSession();

      // 2. 智能中转逻辑
      if (session) {
        // 已登录，跳转到图书管理主控制台
        router.replace('/dashboard');
      } else {
        // 未登录，跳转到登录页
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    // 背景：蓝白偏紫渐变色系
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600">
      
      <div className="text-center space-y-6 animate-pulse">
        {/* 加载动画：白色旋转圆环 */}
        <div className="inline-block w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tighter italic">
            BookSpace<span className="text-blue-200 not-italic">.</span>
          </h1>
          <p className="text-blue-100 text-xs font-bold uppercase tracking-[0.4em]">
            正在安全接入图书管理系统
          </p>
        </div>
      </div>

      {/* 底部装饰文字 */}
      <div className="absolute bottom-10">
         <p className="text-[10px] font-black text-white/40 uppercase tracking-widest italic">
            Digital Library Protocol v3.0
         </p>
      </div>
    </div>
  );
}