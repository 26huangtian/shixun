"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { exportToCSV } from '@/lib/exportUtils';

export default function AdminRecordsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('全部'); // 状态过滤：全部, borrowing, returned

  const fetchAllRecords = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const res = await fetch('/api/admin/records', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      const data = await res.json();
      setRecords(data || []);
    } catch (err) {
      console.error("获取借阅流水失败:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllRecords(); }, []);

  // --- 核心功能：代办还书 ---
  const handleManualReturn = async (id: number, title: string) => {
    if (!confirm(`确定代读者归还《${title}》吗？系统将自动增加图书库存。`)) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/admin/records/${id}/return`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session?.access_token}` }
    });
    
    if (res.ok) {
      alert('还书手续已办理完成，库存已回滚。');
      fetchAllRecords();
    }
  };

  // --- 核心功能：导出审计报表 ---
  const handleExport = () => {
    const exportData = records.map((r: any) => ({
      '记录ID': r.id,
      '借阅人': r.user_name,
      '书籍标题': r.title,
      '借阅日期': r.borrow_date,
      '应还日期': r.due_date,
      '当前状态': r.status === 'borrowing' ? '借阅中' : '已归还'
    }));
    exportToCSV(exportData, 'BookSpace_全馆借阅审计记录', ['ID', '借阅人', '图书', '借阅日期', '应还日期', '状态']);
  };

  // 过滤逻辑
  const filteredRecords = records.filter(r => {
    if (filter === '全部') return true;
    return r.status === filter;
  });

  if (loading) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-black text-[10px] animate-pulse uppercase tracking-[0.3em]">正在审计全馆借阅流水...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-1000 pb-20">
      
      {/* 1. 顶部操作面板 */}
      <div className="flex flex-col xl:flex-row justify-between items-end gap-6 bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">借阅记录审计 <span className="not-italic">⚖️</span></h2>
          <div className="flex items-center gap-6 mt-3">
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                <p className="text-slate-400 text-sm font-medium">总流水: <b className="text-slate-800">{records.length}</b> 条</p>
             </div>
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                <p className="text-slate-400 text-sm font-medium">借出中: <b className="text-slate-800">{records.filter(r=>r.status==='borrowing').length}</b> 本</p>
             </div>
          </div>
        </div>
        
        <div className="flex gap-4 relative z-10">
          <button 
            onClick={handleExport}
            className="px-8 py-4 border-2 border-slate-100 text-slate-400 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95 flex items-center gap-2"
          >
            📥 导出审计报表
          </button>
        </div>
      </div>

      {/* 2. 状态切换标签 */}
      <div className="flex gap-2 px-4">
        {['全部', 'borrowing', 'returned'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                (filter === s) 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            {s === '全部' ? '查看全部' : s === 'borrowing' ? '仅看借阅中' : '仅看已归还'}
          </button>
        ))}
      </div>

      {/* 3. 流水列表表格 */}
      <div className="bg-white rounded-[4rem] shadow-sm border border-slate-50 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">读者与身份</th>
              <th className="px-8 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">借阅图书详情</th>
              <th className="px-8 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">业务状态</th>
              <th className="px-12 py-8 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">行政操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredRecords.map((r: any) => (
              <tr key={r.id} className="hover:bg-indigo-50/20 transition-all duration-300 group">
                <td className="px-12 py-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs uppercase">
                        {r.user_name.charAt(0)}
                    </div>
                    <div>
                        <p className="font-black text-slate-800 text-lg tracking-tight">{r.user_name}</p>
                        <p className="text-[9px] text-slate-300 font-bold uppercase tracking-tighter">Verified Reader</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-8">
                  <p className="font-bold text-indigo-600 tracking-tight italic">《{r.title}》</p>
                  <div className="flex gap-4 mt-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">借: {r.borrow_date}</span>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">至: {r.due_date}</span>
                  </div>
                </td>
                <td className="px-8 py-8">
                   <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                     r.status === 'borrowing' 
                     ? 'bg-amber-50 text-amber-500 border-amber-100 animate-pulse' 
                     : 'bg-green-50 text-green-600 border-green-100'
                   }`}>
                      {r.status === 'borrowing' ? '借阅中' : '已入库'}
                   </span>
                </td>
                <td className="px-12 py-8 text-right">
                   {r.status === 'borrowing' ? (
                     <button 
                       onClick={() => handleManualReturn(r.id, r.title)}
                       className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
                     >
                       代办还书
                     </button>
                   ) : (
                     <span className="text-[10px] font-black text-slate-200 uppercase tracking-[0.2em] italic">No Action Needed</span>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredRecords.length === 0 && (
            <div className="py-40 text-center opacity-30">
                <p className="text-sm font-black uppercase tracking-widest italic">No matching audit logs found</p>
            </div>
        )}
      </div>

      {/* 4. 管理端审计说明 */}
      <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white flex flex-col md:flex-row items-center gap-8 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-lg">🛡️</div>
          <div className="relative z-10 flex-1">
            <h5 className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">审计规范 / Audit Protocol</h5>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed font-medium">
              当前页面展示全校所有读者的实时借阅流水。作为管理员，您可以执行“代办还书”操作，该操作将强制终止读者的借阅周期并即时回滚图书库存。所有行政干预操作均会被系统日志记录，请确保操作的合规性。
            </p>
          </div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 rounded-full -mr-40 -mt-40 blur-3xl"></div>
      </div>
    </div>
  );
}