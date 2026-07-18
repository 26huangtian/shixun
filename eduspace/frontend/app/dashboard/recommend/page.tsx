"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function RecommendPage() {
  const [book, setBook] = useState<any>(null);

  const getNewRecommend = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/books/recommend', {
      headers: { 'Authorization': `Bearer ${session?.access_token}` }
    });
    const data = await res.json();
    setBook(data);
  };

  useEffect(() => { getNewRecommend(); }, []);

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center space-y-10 min-h-[70vh]">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-slate-800 italic tracking-tighter uppercase">每日灵感 ✨</h2>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Today's Choice For You</p>
      </div>

      {book && (
        <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-50 flex flex-col md:flex-row gap-12 items-center animate-in zoom-in duration-700">
           <div className="w-64 h-80 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] shadow-2xl flex items-center justify-center text-7xl text-white italic font-black">
              {book.title.charAt(0)}
           </div>
           <div className="flex-1 space-y-6">
              <div>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase">{book.category}</span>
                <h3 className="text-4xl font-black text-slate-800 mt-4 tracking-tighter">{book.title}</h3>
                <p className="text-slate-400 font-bold italic mt-1">Author: {book.author}</p>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed font-medium bg-slate-50 p-6 rounded-[2rem]">“{book.description}”</p>
              <button onClick={getNewRecommend} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">换一换</button>
           </div>
        </div>
      )}
    </div>
  );
}