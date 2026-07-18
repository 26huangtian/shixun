"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LibraryPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部'); 
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<any>(null);

  const categories = ['全部', '科幻', '文学', '编程', '历史', '哲学', '艺术'];

  const fetchBooks = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const url = `/api/books?search=${search}&category=${category}`;
    
    try {
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      
      // 核心修复：检查响应头是否为 JSON，防止解析 HTML 报错
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setBooks(data.books || []);
      } else {
        console.error("后端未返回正确的JSON数据");
      }
    } catch (err) {
      console.error("加载书籍失败", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [search, category]);

  const handleBorrow = async (id: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const res = await fetch('/api/books/borrow', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify({ book_id: id })
      });
      
      const result = await res.json();
      if (res.ok) {
        alert("✅ " + result.message);
        setSelectedBook(null); 
        fetchBooks();
      } else {
        alert("❌ " + (result.message || "借阅失败"));
      }
    } catch (err) {
      alert("❌ 系统连接异常，请检查后端运行状态");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-1000 pb-20">
      
      {/* 搜索栏 */}
      <div className="flex flex-col xl:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic">发现好书 <span className="not-italic">🏛️</span></h2>
        </div>
        <div className="relative w-full xl:w-[450px]">
            <input 
              type="text" 
              placeholder="搜索书名..." 
              className="w-full pl-14 pr-6 py-5 rounded-[2rem] border border-slate-100 bg-white shadow-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold"
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
        </div>
      </div>

      {/* 分类栏 */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-8 py-3 rounded-2xl text-xs font-black transition-all whitespace-nowrap ${category === cat ? 'bg-slate-900 text-white shadow-2xl scale-105' : 'bg-white text-slate-400 border border-slate-50'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* 图书网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        {books.map(book => (
          <div key={book.id} onClick={() => setSelectedBook(book)} className="group bg-white p-5 rounded-[2.8rem] border border-slate-100 hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden">
              <div className="w-full aspect-[3/4.2] bg-slate-50 rounded-[2rem] mb-5 flex items-center justify-center text-6xl shadow-inner">
                📖
              </div>
              <h4 className="text-xl font-black text-slate-800 line-clamp-1">{book.title}</h4>
              <p className="text-[11px] text-slate-400 font-bold italic">By {book.author}</p>
          </div>
        ))}
      </div>

      {/* --- 重点修复：图书详情 Modal --- */}
      {selectedBook && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl z-[9999] flex items-center justify-center p-6">
          <div 
            className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 relative"
            onClick={(e) => e.stopPropagation()} // 防止点击内部关闭
          >
             {/* 修复：关闭按钮 z-index 提升，确保可点 */}
             <button 
                onClick={(e) => {
                    e.preventDefault();
                    setSelectedBook(null);
                }} 
                className="absolute top-8 right-8 w-12 h-12 bg-white/20 hover:bg-white/40 text-white rounded-2xl flex items-center justify-center text-2xl z-[10000] border border-white/20 transition-all cursor-pointer"
                aria-label="关闭"
            >✕</button>

             <div className="relative h-56 bg-gradient-to-br from-indigo-600 to-purple-600 p-12 flex items-end">
                <div className="text-white">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Book Details</span>
                    <h3 className="text-4xl font-black italic tracking-tighter mt-2">{selectedBook.title}</h3>
                </div>
             </div>

             <div className="p-12 space-y-10">
                <div className="grid grid-cols-2 gap-8">
                    <div className="bg-slate-50 p-5 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase">作者</p>
                        <p className="font-bold text-slate-700">{selectedBook.author}</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase">馆内架位</p>
                        <p className="font-bold text-indigo-600">{selectedBook.location}</p>
                    </div>
                </div>

                <div className="bg-slate-50 p-8 rounded-[2.5rem]">
                    <p className="text-sm text-slate-500 leading-relaxed font-medium italic">
                        “{selectedBook.description}”
                    </p>
                </div>

                <button 
                  onClick={() => handleBorrow(selectedBook.id)}
                  disabled={selectedBook.is_borrowed || selectedBook.stock <= 0}
                  className={`w-full py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] transition-all shadow-2xl active:scale-95 ${
                    selectedBook.is_borrowed ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white'
                  }`}
                >
                  {selectedBook.is_borrowed ? '您正持有此书' : '确认借阅此书'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}