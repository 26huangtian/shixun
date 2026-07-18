"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LibraryPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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
    alert(result.message);
    fetchBooks();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-black text-slate-800 italic">在线图书馆 🏛️</h2>
        <input 
          type="text" placeholder="搜索书名、作者..." 
          className="w-full md:w-80 px-6 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold"
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {books.map(book => (
          <div key={book.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all flex flex-col justify-between group">
            <div>
              <div className="w-full aspect-[3/4] bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-3xl mb-4 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">📖</div>
              <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg uppercase">{book.category}</span>
              <h4 className="text-lg font-black text-slate-800 mt-2 line-clamp-1">{book.title}</h4>
              <p className="text-xs text-slate-400 font-bold italic">{book.author}</p>
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <span className="text-xs font-black text-slate-400">库存: {book.stock}</span>
              <button 
                onClick={() => handleBorrow(book.id)}
                disabled={book.is_borrowed || book.stock <= 0}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${book.is_borrowed ? 'bg-slate-100 text-slate-300' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95'}`}
              >
                {book.is_borrowed ? '已借阅' : book.stock <= 0 ? '无货' : '立即借阅'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}