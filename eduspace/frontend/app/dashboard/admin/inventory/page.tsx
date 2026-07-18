"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { exportToCSV } from '@/lib/exportUtils';

export default function AdminInventoryPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 弹窗与表单状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null); 
  const [submitting, setSubmitting] = useState(false);

  // 初始化表单数据
  const initialForm = {
    title: '',
    author: '',
    isbn: '',
    category: '文学',
    stock: 5,
    location: 'A区-人文社科',
    description: ''
  };
  const [formData, setFormData] = useState(initialForm);

  // 配置常量
  const categories = ['文学', '科幻', '编程', '历史', '哲学', '经管', '艺术', '教育'];
  const locations = [
    'A区-人文社科', 'B区-自然科学', 'C区-信息技术', 
    'D区-艺术设计', 'E区-参考资料', 'F区-报刊杂志'
  ];

  const fetchInventory = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const headers = { 'Authorization': `Bearer ${session?.access_token}` };
    
    try {
        const res = await fetch('/api/books', { headers });
        const data = await res.json();
        setBooks(data.books || []);
    } catch (err) {
        console.error("同步资产数据失败:", err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  const fetchData = fetchInventory; // 别名兼容

  // --- 核心功能：打开编辑/新增窗口 ---
  const openEditor = (book?: any) => {
    if (book) {
        // 编辑模式：回填该书籍的所有真实数据
        setEditingId(book.id);
        setFormData({
            title: book.title,
            author: book.author,
            isbn: book.isbn || '',
            category: book.category,
            stock: book.stock,
            location: book.location || 'A区-人文社科',
            description: book.description || ''
        });
    } else {
        // 新增模式：重置为空表单
        setEditingId(null);
        setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  // --- 核心功能：全量资产导出 ---
  const handleExport = () => {
    const exportData = books.map((b: any) => ({
      '资产编号': b.id,
      '书名': b.title,
      '作者': b.author,
      'ISBN': b.isbn || '未录入',
      '分类': b.category,
      '物理架位': b.location || '待分配',
      '在馆库存': b.stock,
      '内容简介': b.description || '无'
    }));
    exportToCSV(exportData, 'BookSpace_全校资产档案', ['ID', '书名', '作者', 'ISBN', '分类', '位置', '库存', '描述']);
  };

  // --- 核心功能：提交保存（自动识别 POST 或 PUT） ---
  const handleSave = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/admin/books/${editingId}` : '/api/admin/books';
    
    try {
        const res = await fetch(url, {
            method,
            headers: { 
              'Content-Type': 'application/json', 
              'Authorization': `Bearer ${session?.access_token}` 
            },
            body: JSON.stringify({ ...formData, id: editingId })
          });
      
          if (res.ok) {
            setIsModalOpen(false);
            fetchInventory();
          } else {
            alert("操作失败，请检查数据格式");
          }
    } finally {
        setSubmitting(false);
    }
  };

  const deleteBook = async (id: number) => {
    if(!confirm('🚨 严重警告：删除后该图书的所有借阅历史和收藏记录将同步消失，确定吗？')) return;
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`/api/admin/books/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session?.access_token}` }
    });
    fetchInventory();
  };

  if (loading) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-black text-[10px] animate-pulse uppercase tracking-[0.3em]">正在接入全球馆藏数据库...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-1000 pb-20">
      
      {/* 1. 顶部操作看板 */}
      <div className="flex flex-col xl:flex-row justify-between items-end gap-6 bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">资产实物管理 <span className="not-italic">📦</span></h2>
          <p className="text-slate-400 text-sm mt-1 font-medium tracking-tight">管理全校共 {books.length} 种图书资源，支持实时调配与审计导出</p>
        </div>
        <div className="flex gap-4 relative z-10">
          <button 
            onClick={handleExport}
            className="px-8 py-4 border-2 border-slate-100 text-slate-400 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95"
          >
            📥 导出全量报表
          </button>
          <button 
            onClick={() => openEditor()}
            className="px-10 py-4 bg-indigo-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            + 登记新入库图书
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
      </div>

      {/* 2. 资产列表网格 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {books.map((c:any) => (
              <div key={c.id} className="group bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 flex flex-col justify-between relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="text-2xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors tracking-tighter uppercase italic">{c.title}</h4>
                            <p className="text-xs font-bold text-slate-400 mt-1 italic">Author: {c.author}</p>
                        </div>
                        <div className="text-right">
                             <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-sm ${c.stock < 2 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                                库存: {c.stock.toString().padStart(2, '0')}
                            </span>
                            <p className="text-[9px] font-black text-slate-300 mt-2 uppercase tracking-widest">📍 {c.location || '待分配'}</p>
                        </div>
                    </div>
                    <div className="mt-6 flex gap-2">
                        <span className="text-[9px] font-black bg-slate-900 text-white px-3 py-1 rounded-lg uppercase tracking-widest">
                           {c.category}
                        </span>
                        <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-3 py-1 rounded-lg uppercase tracking-widest">
                           ISBN: {c.isbn || 'N/A'}
                        </span>
                    </div>
                  </div>

                  <div className="mt-12 flex gap-3 relative z-10">
                      <button 
                        onClick={() => openEditor(c)} 
                        className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm"
                      >
                        ✏️ 编辑资产参数
                      </button>
                      <button 
                        onClick={() => deleteCourse(c.id)} 
                        className="px-6 py-4 bg-slate-50 text-slate-200 rounded-2xl hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
                      >
                        🗑️
                      </button>
                  </div>
                  <div className="absolute -right-6 -bottom-6 text-8xl opacity-[0.03] font-black italic group-hover:scale-110 transition-transform select-none uppercase tracking-tighter">ASSET</div>
              </div>
          ))}
      </div>

      {/* --- 3. 编辑/新增 统一 Modal (重点优化项) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl z-[9999] flex items-center justify-center p-6 overflow-y-auto">
           <div className="bg-white w-full max-w-3xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in duration-500 my-auto">
              
              {/* Modal 页眉 */}
              <div className={`p-10 text-white flex justify-between items-center ${editingId ? 'bg-slate-900' : 'bg-indigo-600'}`}>
                 <div>
                    <h3 className="text-3xl font-black italic tracking-tighter uppercase">
                        {editingId ? '修改图书档案' : '录入全新图书'}
                    </h3>
                    <p className="text-[10px] opacity-70 mt-1 uppercase font-bold tracking-[0.3em]">
                        {editingId ? `正在编辑资产 ID: ${editingId}` : '即将向云端数据库写入新记录'}
                    </p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-xl hover:bg-white/20 transition-all">✕</button>
              </div>

              {/* Modal 表单区 */}
              <form onSubmit={handleSave} className="p-12 space-y-10 bg-white">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">1. 书籍完整标题 / Full Title</label>
                        <input type="text" required placeholder="例如：三体全集" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold focus:ring-4 focus:ring-indigo-50 transition-all outline-none" 
                        value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">2. 著作者信息 / Author</label>
                        <input type="text" required placeholder="例如：刘慈欣" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold focus:ring-4 focus:ring-indigo-50 outline-none" 
                        value={formData.author} onChange={e=>setFormData({...formData, author:e.target.value})} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">3. ISBN 国际标准编号</label>
                        <input type="text" placeholder="978-x-xxx-xxxx-x" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold focus:ring-4 focus:ring-indigo-50 outline-none" 
                        value={formData.isbn} onChange={e=>setFormData({...formData, isbn:e.target.value})} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">4. 图书分类</label>
                        <select className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold outline-none cursor-pointer" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">5. 物理存放架位 (选择式)</label>
                        <select className="w-full p-5 bg-indigo-50 text-indigo-600 border-none rounded-2xl font-bold outline-none cursor-pointer focus:ring-4 focus:ring-indigo-100 transition-all" 
                        value={formData.location} onChange={e=>setFormData({...formData, location:e.target.value})}>
                            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">6. 实物库存册数</label>
                        <input type="number" required className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold focus:ring-4 focus:ring-indigo-50 outline-none" 
                        value={formData.stock} onChange={e=>setFormData({...formData, stock:parseInt(e.target.value)})} />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">7. 书籍摘要简介 / Synopsis</label>
                        <textarea rows={4} placeholder="请输入简短的内容概括..." className="w-full p-6 bg-slate-50 border-none rounded-[2.5rem] font-bold text-sm leading-relaxed focus:ring-4 focus:ring-indigo-50 transition-all outline-none resize-none italic text-slate-500"
                        value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})} />
                    </div>
                 </div>
                 
                 <button 
                  disabled={submitting}
                  type="submit" 
                  className={`w-full py-6 rounded-[2.5rem] font-black shadow-2xl transition-all uppercase text-[11px] tracking-[0.4em] active:scale-95 ${
                    editingId ? 'bg-slate-900 text-white shadow-slate-200 hover:bg-black' : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'
                  }`}
                 >
                    {submitting ? "正在同步加密数据..." : editingId ? "✓ 保存云端资产修改" : "✓ 确认新资产入库"}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}