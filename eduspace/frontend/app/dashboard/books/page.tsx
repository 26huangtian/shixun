"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LibraryPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<any>(null); // 用于控制详情弹窗

  const fetchBooks = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/books?search=${search}`, {
      headers: { 'Authorization': `Bearer ${session?.access_token}` }
    });
    const data = await res.json();
    setBooks(data.books || []);
    setLoading(false);
  };

  useEffect(() => { fetchBooks(); }, [search]);

  const handleBorrow = async (id: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/books/borrow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify({ book_id: id })
    });
    const result = await res.json();
    alert(result.message || result.error);
    if (res.ok) {
        setSelectedBook(null); // 借书成功后关闭弹窗
        fetchBooks();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* 顶部搜索 */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic">在线书库中心 <span className="not-italic">🏛️</span></h2>
        <div className="relative w-full md:w-96">
            <input 
            type="text" placeholder="输入书名、作者查找..." 
            className="w-full pl-12 pr-6 py-4 rounded-3xl border border-slate-200 bg-white shadow-sm focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold"
            value={search} onChange={(e) => setSearch(e.target.value)}
            />
            <span className="absolute left-5 top-4.5 text-xl">🔍</span>
        </div>
      </div>

      {/* 图书列表 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {books.map(book => (
          <div 
            key={book.id} 
            onClick={() => setSelectedBook(book)}
            className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:border-indigo-200 transition-all flex flex-col justify-between group cursor-pointer relative"
          >
            <div>
              <div className="w-full aspect-[3/4] bg-gradient-to-tr from-slate-50 to-indigo-50 rounded-3xl mb-4 flex items-center justify-center text-5xl group-hover:scale-105 transition-transform duration-500 shadow-inner">
                {book.category === '科幻' ? '🚀' : book.category === '文学' ? '🎨' : '📖'}
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-md uppercase tracking-tighter">{book.category}</span>
                 {book.stock < 2 && book.stock > 0 && <span className="text-[9px] font-black text-red-500 animate-pulse uppercase">🔥 抢手</span>}
              </div>
              <h4 className="text-lg font-black text-slate-800 mt-2 line-clamp-1">{book.title}</h4>
              <p className="text-[10px] text-slate-400 font-bold italic mt-1">By {book.author}</p>
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <span className={`text-[10px] font-black ${book.stock > 0 ? 'text-slate-400' : 'text-red-400'}`}>库存: {book.stock}</span>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">→</div>
            </div>
          </div>
        ))}
      </div>

      {/* --- 图书详情 Modal --- */}
      {selectedBook && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
             <div className="relative h-48 bg-gradient-to-r from-indigo-600 to-purple-600 p-10 flex items-end">
                <button onClick={() => setSelectedBook(null)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors text-2xl">✕</button>
                <div className="text-white">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Book Details</span>
                    <h3 className="text-3xl font-black italic tracking-tighter">{selectedBook.title}</h3>
                </div>
             </div>
             <div className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-4 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase">作者</p>
                        <p className="font-bold text-slate-700">{selectedBook.author}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase">馆内架位</p>
                        <p className="font-bold text-indigo-600">{selectedBook.location}</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase ml-1">内容简介</p>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium bg-slate-50/50 p-6 rounded-[2rem] italic">
                       “{selectedBook.description}”
                    </p>
                </div>
                <button 
                  onClick={() => handleBorrow(selectedBook.id)}
                  disabled={selectedBook.is_borrowed || selectedBook.stock <= 0}
                  className={`w-full py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl active:scale-95 ${
                    selectedBook.is_borrowed ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 
                    selectedBook.stock <= 0 ? 'bg-red-50 text-red-400 cursor-not-allowed' :
                    'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'
                  }`}
                >
                  {selectedBook.is_borrowed ? '您已借阅此书' : selectedBook.stock <= 0 ? '库存已告罄' : '确认借阅此书'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}