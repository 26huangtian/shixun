"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { exportToCSV } from '@/lib/exportUtils';

export default function AdminInventory() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 1. 初始化包含详细信息的表单
  const initialForm = {
    title: '',
    author: '',
    isbn: '',
    category: '文学',
    stock: 5,
    location: 'A区-01架',
    description: ''
  };
  const [formData, setFormData] = useState(initialForm);

  // 常量定义
  const categories = ['文学', '科幻', '编程', '历史', '哲学', '经管', '艺术'];
  const locations = ['A区-人文社科', 'B区-自然科学', 'C区-信息技术', 'D区-艺术设计', 'E区-参考资料'];

  const fetchInventory = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const res = await fetch('/api/books', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      const data = await res.json();
      setBooks(data.books || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  // 2. 导出全量资产数据逻辑
  const handleExport = () => {
    const exportData = books.map((b: any) => ({
      '资产编号': b.id,
      '书名': b.title,
      '作者': b.author,
      'ISBN': b.isbn || '未录入',
      '类目': b.category,
      '存放架位': b.location || '待分配',
      '在馆库存': b.stock,
      '内容摘要': b.description || '无'
    }));
    exportToCSV(exportData, 'BookSpace_资产清单', ['ID', '书名', '作者', 'ISBN', '分类', '位置', '库存', '简介']);
  };

  const handleAddBook = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    try {
      const res = await fetch('/api/admin/books', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        alert('✨ 图书资产已成功同步至云端仓库！');
        setShowAddModal(false);
        setFormData(initialForm);
        fetchInventory();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* 顶部工具栏 */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">资产管理控制台 <span className="not-italic">📦</span></h2>
          <p className="text-slate-400 text-sm mt-1 font-medium italic">Managed Repository & Inventory System</p>
        </div>
        <div className="flex gap-4">
          <button onClick={handleExport} className="px-8 py-4 border-2 border-slate-100 text-slate-400 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95">
            📥 导出资产审计
          </button>
          <button onClick={() => setShowAddModal(true)} className="bg-indigo-600 text-white px-10 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
            + 登记新资产
          </button>
        </div>
      </div>

      {/* 资产列表 */}
      <div className="bg-white rounded-[4rem] shadow-sm border border-slate-50 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">书籍信息 / 作者</th>
              <th className="px-8 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">分类及架位</th>
              <th className="px-8 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">在馆库存</th>
              <th className="px-12 py-8 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {books.map(book => (
              <tr key={book.id} className="hover:bg-indigo-50/20 transition-all duration-500 group">
                <td className="px-12 py-8">
                  <div className="flex flex-col">
                    <span className="font-black text-slate-800 text-lg tracking-tight italic uppercase">{book.title}</span>
                    <span className="text-[10px] text-slate-400 font-bold mt-1">Author: {book.author}</span>
                  </div>
                </td>
                <td className="px-8 py-8">
                  <div className="flex flex-col gap-1.5">
                    <span className="w-fit px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black rounded uppercase">{book.category}</span>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">📍 {book.location || '未标记'}</span>
                  </div>
                </td>
                <td className="px-8 py-8 font-black text-xl text-slate-700 italic">
                  {book.stock.toString().padStart(2, '0')} <small className="text-[10px] not-italic opacity-30 uppercase ml-1">Copies</small>
                </td>
                <td className="px-12 py-8 text-right">
                  <button className="text-slate-200 hover:text-red-500 transition-colors">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- 优化后的添加弹窗 (Modal) --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-6 overflow-y-auto">
           <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in duration-500 my-auto">
              
              {/* Header */}
              <div className="bg-slate-900 p-10 text-white flex justify-between items-center relative">
                 <div>
                    <h3 className="text-3xl font-black italic tracking-tighter uppercase">新图书资产入库</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">Global Repository Inventory Sync</p>
                 </div>
                 <button onClick={() => setShowAddModal(false)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-xl hover:bg-white/10 transition-all">✕</button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddBook} className="p-12 space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">1. 书籍完整标题</label>
                        <input type="text" required placeholder="例如：三体全集" className="w-full p-5 bg-slate-50 border-none rounded-3xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-50 outline-none transition-all" 
                        value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">2. 著作者信息</label>
                        <input type="text" required placeholder="例如：刘慈欣" className="w-full p-5 bg-slate-50 border-none rounded-3xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-50 outline-none transition-all" 
                        value={formData.author} onChange={e=>setFormData({...formData, author:e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">3. ISBN 编号</label>
                        <input type="text" placeholder="978-x-xxx-xxxx-x" className="w-full p-5 bg-slate-50 border-none rounded-3xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-50 outline-none transition-all" 
                        value={formData.isbn} onChange={e=>setFormData({...formData, isbn:e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">4. 借阅类目</label>
                        <select className="w-full p-5 bg-slate-50 border-none rounded-3xl font-bold outline-none cursor-pointer" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    {/* 位置选择：核心要求优化点 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">5. 存放物理架位</label>
                        <select className="w-full p-5 bg-indigo-50 text-indigo-600 border-none rounded-3xl font-bold outline-none cursor-pointer focus:ring-4 focus:ring-indigo-100 transition-all" 
                        value={formData.location} onChange={e=>setFormData({...formData, location:e.target.value})}>
                            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">6. 初始库存数量</label>
                        <input type="number" required className="w-full p-5 bg-slate-50 border-none rounded-3xl font-bold focus:ring-4 focus:ring-indigo-50 transition-all outline-none" 
                        value={formData.stock} onChange={e=>setFormData({...formData, stock:parseInt(e.target.value)})} />
                    </div>
                    {/* 描述信息：核心要求优化点 */}
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">7. 书籍内容摘要 / Synopsis</label>
                        <textarea rows={4} placeholder="请输入书籍简介..." className="w-full p-6 bg-slate-50 border-none rounded-[2.5rem] font-bold text-sm leading-relaxed focus:ring-4 focus:ring-indigo-50 transition-all outline-none resize-none"
                        value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})} />
                    </div>
                 </div>

                 <button disabled={submitting} type="submit" className="w-full py-6 bg-indigo-600 text-white font-black rounded-[2.5rem] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all uppercase text-[11px] tracking-[0.3em]">
                    {submitting ? "正在写入加密数据库..." : "✓ 确认资产入库并授权公开流通"}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}