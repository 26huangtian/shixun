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
      const data = await res.json();
      setBooks(data.books || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooks(); }, [search, category]);

  // --- 核心新增：执行收藏/取消收藏功能 ---
  const handleToggleWishlist = async (e: React.MouseEvent, bookId: number) => {
    e.stopPropagation(); // 阻止触发卡片详情弹窗
    const { data: { session } } = await supabase.auth.getSession();
    
    const res = await fetch('/api/wishlist/toggle', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}` 
      },
      body: JSON.stringify({ book_id: bookId })
    });

    if (res.ok) {
        // 局部更新状态，实现“秒变红”的丝滑感
        setBooks(books.map(b => b.id === bookId ? { ...b, is_wishlisted: !b.is_wishlisted } : b));
    }
  };

  const handleBorrow = async (id: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/books/borrow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify({ book_id: id })
    });
    const result = await res.json();
    alert(result.message || result.error);
    if (res.ok) { setSelectedBook(null); fetchBooks(); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-1000 pb-20">
      
      {/* 顶部标题与搜索 */}
      <div className="flex flex-col xl:flex-row justify-between items-center gap-6">
        <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Global Bookpool <span className="not-italic">🏛️</span></h2>
        <div className="relative w-full xl:w-[450px]">
            <input type="text" placeholder="搜索馆藏资源..." 
              className="w-full pl-14 pr-6 py-5 rounded-[2rem] border border-slate-100 bg-white shadow-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold"
              value={search} onChange={(e) => setSearch(e.target.value)} />
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
        </div>
      </div>

      {/* 分类栏 */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${category === cat ? 'bg-slate-900 text-white shadow-2xl scale-105' : 'bg-white text-slate-400 border border-slate-50'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* 图书网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        {books.map(book => (
          <div 
            key={book.id} 
            onClick={() => setSelectedBook(book)} 
            className="group bg-white p-5 rounded-[2.8rem] border border-slate-100 hover:shadow-2xl transition-all duration-500 cursor-pointer relative"
          >
              {/* --- 核心新增：收藏爱心按钮 --- */}
              <button 
                onClick={(e) => handleToggleWishlist(e, book.id)}
                className={`absolute top-8 right-8 z-20 w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all shadow-md active:scale-75 ${
                    book.is_wishlisted ? 'bg-pink-500 text-white' : 'bg-white/80 backdrop-blur-sm text-slate-300 hover:text-pink-400'
                }`}
              >
                {book.is_wishlisted ? '❤️' : '🤍'}
              </button>

              <div className="w-full aspect-[3/4.2] bg-slate-50 rounded-[2rem] mb-5 flex items-center justify-center text-6xl shadow-inner group-hover:scale-105 transition-transform duration-700">
                {book.category === '科幻' ? '🚀' : book.category === '编程' ? '💻' : '📖'}
              </div>
              
              <div className="px-1">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-md uppercase">{book.category}</span>
                    {book.stock < 2 && book.stock > 0 && <span className="text-[9px] font-black text-red-500 animate-pulse uppercase">HOT</span>}
                </div>
                <h4 className="text-xl font-black text-slate-800 line-clamp-1 tracking-tight italic uppercase">{book.title}</h4>
                <p className="text-[10px] text-slate-400 font-bold italic">By {book.author}</p>
                
                <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase">Stock: {book.stock}</p>
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs group-hover:bg-indigo-600 transition-all">→</div>
                </div>
              </div>
          </div>
        ))}
      </div>

      {/* 图书详情弹窗（保持原有逻辑，已修复关闭按钮） */}
      {selectedBook && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl z-[9999] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 relative">
             <button onClick={() => setSelectedBook(null)} className="absolute top-10 right-10 w-12 h-12 bg-white/10 hover:bg-white/40 text-white rounded-2xl flex items-center justify-center text-xl z-[10000] border border-white/20 transition-all">✕</button>
             <div className="relative h-56 bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 p-12 flex items-end">
                <div className="text-white">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Library Repository</span>
                    <h3 className="text-4xl font-black italic tracking-tighter mt-2">{selectedBook.title}</h3>
                </div>
             </div>
             <div className="p-12 space-y-10">
                <div className="grid grid-cols-2 gap-8">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Author</p>
                        <p className="font-bold text-slate-700">{selectedBook.author}</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Location</p>
                        <p className="font-bold text-indigo-600">{selectedBook.location}</p>
                    </div>
                </div>
                <div className="bg-slate-50 p-8 rounded-[2.5rem]">
                    <p className="text-sm text-slate-500 leading-relaxed font-medium italic">“{selectedBook.description}”</p>
                </div>
                <button onClick={() => handleBorrow(selectedBook.id)} disabled={selectedBook.is_borrowed || selectedBook.stock <= 0}
                  className={`w-full py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] transition-all shadow-2xl active:scale-95 ${selectedBook.is_borrowed ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-black'}`}>
                  {selectedBook.is_borrowed ? '📖 正在借阅中' : '✓ 确认借阅此书'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}