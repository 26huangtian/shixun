"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function WishlistPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchWishlist = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }

    try {
      const res = await fetch('/api/wishlist', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      setList(data || []);
    } catch (err) {
      console.error("加载收藏失败", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWishlist(); }, []);

  const toggleWishlist = async (id: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/wishlist/toggle', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}` 
      },
      body: JSON.stringify({ book_id: id })
    });
    if (res.ok) fetchWishlist(); // 刷新列表
  };

  if (loading) return <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse italic">Accessing Wishlist...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-1000 pb-20">
      
      {/* 顶部标题 */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-4">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic">我的心愿单 <span className="not-italic">💖</span></h2>
          <p className="text-slate-400 text-sm mt-1 font-medium italic underline decoration-pink-200 decoration-2 underline-offset-4">My Private Book Collection</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase text-center">收藏总数</p>
            <p className="text-2xl font-black text-pink-500 text-center">{list.length}</p>
        </div>
      </div>

      {/* 收藏列表网格 */}
      {list.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {list.map((book) => (
            <div 
              key={book.id} 
              className="bg-white p-7 rounded-[2.8rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                   <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-tighter">
                       {book.category}
                   </span>
                   <button 
                      onClick={() => toggleWishlist(book.id)}
                      className="text-2xl hover:scale-125 transition-transform drop-shadow-sm"
                   >
                      ❤️
                   </button>
                </div>
                <h4 className="text-2xl font-black text-slate-800 mt-6 tracking-tighter leading-tight group-hover:text-indigo-600 transition-colors uppercase italic">
                    {book.title}
                </h4>
                <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest border-l-2 border-indigo-200 pl-3 italic">
                    Author: {book.author}
                </p>
              </div>

              <button 
                onClick={() => router.push(`/dashboard/books`)}
                className="mt-10 w-full py-4 bg-slate-50 text-slate-400 font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm"
              >
                立即查看图书详情
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 animate-in zoom-in duration-1000">
           <div className="text-6xl mb-6 grayscale opacity-20">💖</div>
           <h3 className="text-2xl font-black text-slate-300 italic uppercase tracking-widest">收藏夹空空如也</h3>
           <p className="text-slate-400 mt-2 text-sm">去在线书库寻找您的下一本读物吧</p>
           <button 
             onClick={() => router.push('/dashboard/books')}
             className="mt-8 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
           >
             前往书库中心
           </button>
        </div>
      )}
    </div>
  );
}