"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminRecords() {
  const [records, setRecords] = useState([]);

  const fetchAllRecords = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/admin/records', {
      headers: { 'Authorization': `Bearer ${session?.access_token}` }
    });
    const data = await res.json();
    setRecords(data);
  };

  useEffect(() => { fetchAllRecords(); }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <h2 className="text-3xl font-black text-slate-800 italic uppercase">借阅实时审计 <span className="not-italic">⚖️</span></h2>
      
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">借阅者</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">所借图书</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">状态</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">到期日</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {records.map((r: any) => (
              <tr key={r.id} className="hover:bg-indigo-50/20 transition-all">
                <td className="px-8 py-5 font-black text-slate-700">{r.user_name}</td>
                <td className="px-8 py-5 font-bold text-indigo-600">《{r.title}》</td>
                <td className="px-8 py-5">
                   <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${r.status === 'borrowing' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                      {r.status === 'borrowing' ? '借阅中' : '已归还'}
                   </span>
                </td>
                <td className="px-8 py-5 text-sm font-mono text-slate-400">{r.due_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}