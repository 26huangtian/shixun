"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { exportToCSV } from '@/lib/exportUtils';

export default function ReaderManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null); // 选中的读者详情
  const [fetchingDetail, setFetchingDetail] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${session?.access_token}` }
    });
    const data = await res.json();
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  // --- 穿透查询读者档案 ---
  const viewDetail = async (userId: string) => {
    setFetchingDetail(true);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const res = await fetch(`/api/admin/user-detail/${userId}`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      const data = await res.json();
      setSelectedUser(data);
    } finally {
      setFetchingDetail(false);
    }
  };

  const handleExport = () => {
    const exportData = users.map((u: any) => ({
      '识别码': u.id,
      '姓名': u.name || '未命名',
      '身份': u.role === 'teacher' ? '教职' : '学生',
    }));
    exportToCSV(exportData, 'BookSpace_全校读者名录', ['UID', '真实姓名', '系统身份']);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* 顶部标题与导出 */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">读者权限中心 <span className="not-italic">👥</span></h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">全校注册读者总数：<b className="text-indigo-600">{users.length}</b> 位</p>
        </div>
        <button 
          onClick={handleExport}
          className="px-8 py-4 border-2 border-slate-900 text-slate-900 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all active:scale-95"
        >
          📥 导出全校名录
        </button>
      </div>

      {/* 读者列表 */}
      <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-50 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">姓名与识别码</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">当前角色</th>
              <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-indigo-50/20 transition-all group">
                <td className="px-10 py-6">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs">
                        {u.name?.charAt(0) || 'U'}
                     </div>
                     <div>
                        <p className="font-black text-slate-700 text-lg tracking-tighter italic">{u.name || '未命名'}</p>
                        <code className="text-[9px] text-slate-300 font-mono">{u.id}</code>
                     </div>
                  </div>
                </td>
                <td className="px-10 py-6 text-center">
                    <span className="px-4 py-1.5 bg-white border border-slate-100 rounded-xl text-[9px] font-black uppercase text-slate-400 shadow-sm">
                        {u.role}
                    </span>
                </td>
                <td className="px-10 py-6 text-right">
                    <button 
                      onClick={() => viewDetail(u.id)}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                    >
                      档案穿透
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- 重点：读者详细档案 Modal (上帝视角) --- */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl z-[9999] flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in duration-500 my-auto">
             
             {/* Modal Header */}
             <div className="bg-slate-900 p-12 text-white flex justify-between items-start relative overflow-hidden">
                <div className="relative z-10">
                    <span className="px-3 py-1 bg-indigo-600 text-[10px] font-black rounded-md inline-block uppercase tracking-widest mb-4">God Mode / Archive</span>
                    <h3 className="text-5xl font-black italic tracking-tighter uppercase">{selectedUser.name} <span className="text-indigo-500 not-italic">Profile</span></h3>
                    <p className="text-slate-500 mt-2 font-bold uppercase text-xs tracking-widest italic">{selectedUser.role} Account Activated</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-xl hover:bg-white/10 transition-all relative z-10">✕</button>
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full -mr-40 -mt-40 blur-3xl"></div>
             </div>

             {/* Modal Body */}
             <div className="p-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* 借阅历史流水 */}
                <div className="space-y-6">
                   <h4 className="text-xs font-black text-slate-300 uppercase tracking-[0.3em] flex items-center gap-2">
                     <span className="w-8 h-[1px] bg-slate-200"></span> Borrowing History
                   </h4>
                   <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 min-h-[300px] shadow-inner space-y-4">
                      {selectedUser.borrow_history.map((h: any, i: number) => (
                        <div key={i} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
                           <div>
                             <p className="font-bold text-slate-700 text-sm">《{h.title}》</p>
                             <p className="text-[10px] text-slate-300 uppercase mt-1 font-black">Due: {h.due_date}</p>
                           </div>
                           <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${h.status === 'borrowing' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'}`}>
                              {h.status}
                           </span>
                        </div>
                      ))}
                      {selectedUser.borrow_history.length === 0 && <p className="text-center py-20 text-slate-300 italic text-xs">暂无历史借阅数据</p>}
                   </div>
                </div>

                {/* 读者心愿单 */}
                <div className="space-y-6">
                   <h4 className="text-xs font-black text-slate-300 uppercase tracking-[0.3em] flex items-center gap-2">
                     <span className="w-8 h-[1px] bg-slate-200"></span> Public Wishlist
                   </h4>
                   <div className="bg-indigo-50/50 rounded-[2.5rem] p-8 border border-indigo-100 min-h-[300px] shadow-inner space-y-4">
                      {selectedUser.wishlist.map((w: any, i: number) => (
                         <div key={i} className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl">
                            <span className="text-xl">❤️</span>
                            <div>
                               <p className="font-bold text-slate-800 text-sm">《{w.title}》</p>
                               <p className="text-[9px] text-indigo-400 font-black uppercase">{w.category}</p>
                            </div>
                         </div>
                      ))}
                      {selectedUser.wishlist.length === 0 && <p className="text-center py-20 text-indigo-300 italic text-xs">读者尚未添加心愿</p>}
                   </div>
                </div>

             </div>
          </div>
        </div>
      )}
    </div>
  );
}