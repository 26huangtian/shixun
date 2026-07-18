"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function MyBooksPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMyRecords = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        router.push('/login');
        return;
    }

    try {
      const res = await fetch('/api/my-borrowing', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setRecords(data);
      }
    } catch (err) {
      console.error("获取记录失败", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyRecords(); }, []);

  // 还书功能
  const handleReturn = async (recordId: number) => {
    if (!confirm('确定要归还这本书吗？')) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/books/return', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}` 
      },
      body: JSON.stringify({ record_id: recordId })
    });

    if (res.ok) {
      alert('归还成功！库存已实时更新。');
      fetchMyRecords(); // 刷新列表
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
      <p className="text-slate-400 font-bold text-sm animate-pulse uppercase tracking-widest">正在调取个人借阅档案...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 顶部标题 */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic">我的借阅清单 <span className="not-italic">🔖</span></h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">系统已为您实时同步个人借阅状态与还书提醒</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">累计借阅</p>
            <p className="text-xl font-black text-indigo-600 text-center">{records.length}</p>
        </div>
      </div>

      {/* 借阅列表 */}
      {records.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {records.map((rec) => (
            <div 
              key={rec.record_id} 
              className={`bg-white p-6 rounded-[2.2rem] border transition-all flex flex-col md:flex-row items-center justify-between shadow-sm hover:shadow-md ${
                rec.status === 'returned' ? 'opacity-60 grayscale-[50%]' : 'border-slate-100'
              }`}
            >
              <div className="flex items-center gap-6">
                {/* 封面占位符 */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
                    rec.status === 'returned' ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  {rec.status === 'returned' ? '⌛' : '📘'}
                </div>
                
                <div>
                  <h4 className="text-xl font-black text-slate-800">{rec.title}</h4>
                  <p className="text-xs font-bold text-slate-400 italic">作者：{rec.author}</p>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">借阅日期: {rec.borrow_date}</span>
                    <span className={`text-[10px] font-black uppercase ${
                        rec.status === 'returned' ? 'text-green-500' : 'text-orange-500 animate-pulse'
                    }`}>
                        {rec.status === 'returned' ? `已于 ${rec.return_date} 归还` : `应还日期: ${rec.due_date}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 md:mt-0 flex gap-3">
                {rec.status === 'borrowing' ? (
                  <>
                    <button 
                      onClick={() => handleReturn(rec.record_id)}
                      className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-200"
                    >
                      立即归还
                    </button>
                    <button className="px-6 py-3 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                      申请续借
                    </button>
                  </>
                ) : (
                  <span className="px-6 py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-100">
                    已入库
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 空状态展示 */
        <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
          <div className="text-6xl mb-6 opacity-20 grayscale">📚</div>
          <h3 className="text-xl font-black text-slate-800 italic">您的书架还是空的</h3>
          <p className="text-slate-400 mt-2 text-sm font-medium">发现心仪的好书并开启您的阅读之旅吧</p>
          <button 
            onClick={() => router.push('/dashboard/books')}
            className="mt-8 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
          >
            前往图书馆浏览
          </button>
        </div>
      )}

      {/* 温馨提示 */}
      <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-lg">💡</div>
          <p className="text-[11px] text-indigo-700/70 font-medium leading-relaxed uppercase tracking-tight">
            <b>借阅须知：</b>每本书借阅周期为 30 天。若无法按时归还，请在到期前 3 天点击“申请续借”。逾期归还将影响您的信用额度并可能产生每日 0.5 元的延滞金。
          </p>
      </div>
    </div>
  );
}