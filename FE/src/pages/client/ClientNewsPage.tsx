import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from "dompurify";
import { CalendarDaysIcon, TagIcon, ArrowRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import { articleService } from '../../modules/article/services/articleService';
import type { ArticleItem } from '../../modules/article/types/article.types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function readTime(content: string) {
    const words = content?.replace(/<[^>]*>/g, '').split(/\s+/).length ?? 0;
    return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

function stripHtml(html: string) {
    return html?.replace(/<[^>]*>/g, '') ?? '';
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ClientNewsPage() {
    const navigate = useNavigate();
    const [articles, setArticles] = useState<ArticleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        articleService.getAll()
            .then(data => setArticles(data.filter(a => a.isActive)))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Lấy danh sách categories từ data thật
    const allCategories = ['All', ...Array.from(new Set(
        articles.flatMap(a => a.categories.map(c => c.name))
    ))];

    // Bài đầu tiên làm featured (luôn hiển thị, không bị ảnh hưởng bởi filter)
    const featured = articles[0] ?? null;

    // Grid: bỏ featured, áp filter category + search
    const filtered = articles
        .slice(1)
        .filter(a => activeCategory === 'All' || a.categories.some(c => c.name === activeCategory))
        .filter(a =>
            searchQuery === '' ||
            a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            stripHtml(a.content).toLowerCase().includes(searchQuery.toLowerCase())
        );

    return (
        <div className="w-full bg-[#f8fafc] text-slate-800 pb-24 font-sans min-h-screen">

            {/* ── Hero Banner ─────────────────────────────────────────── */}
            <div className="relative pt-[48px] overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt="News Banner"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/90" />
                </div>
                <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-20 text-center">
                    <span className="text-cyan-400 font-bold tracking-[0.3em] uppercase text-xs mb-4 block">
                        The Grandeur Journal
                    </span>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight">
                        News, Stories &<br />
                        <span className="text-cyan-400 italic font-light">Exclusive Offers</span>
                    </h1>
                    <p className="text-slate-300 text-base md:text-lg max-w-xl mx-auto mt-4">
                        Stay in the know — from hotel milestones and promotions to local travel guides and community stories.
                    </p>
                    <div className="mt-10 max-w-lg mx-auto relative">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        <input
                            id="news-search"
                            type="text"
                            placeholder="Search articles, events, offers…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-5 py-4 rounded-xl bg-white/90 backdrop-blur text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-xl"
                        />
                    </div>
                </div>
            </div>

            {/* ── Loading / Empty ──────────────────────────────────────── */}
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : articles.length === 0 ? (
                <div className="text-center py-32 text-slate-400">
                    <p className="text-lg font-medium">Chưa có bài viết nào.</p>
                </div>
            ) : (
                <>
                    {/* ── Featured Article ──────────────────────────────── */}
                    {featured && (
                        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 -mt-8 relative z-20">
                            <div
                                className="bg-white shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 group cursor-pointer"
                                onClick={() => navigate(`/news/${featured.id}`)}
                            >
                                <div className="relative h-72 lg:h-auto overflow-hidden">
                                    <img
                                        src={featured.thumbnailUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'}
                                        alt={featured.title}
                                        className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/30" />
                                    <div className="absolute top-5 left-5 flex gap-2">
                                        <span className="bg-cyan-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">Featured</span>
                                        {featured.categories[0] && (
                                            <span className="bg-slate-800 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
                                                {featured.categories[0].name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-10 lg:p-14 flex flex-col justify-center bg-white">
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {featured.categories.map(c => (
                                            <span key={c.id} className="px-3 py-1 rounded-full text-xs font-bold border border-cyan-200 bg-cyan-50 text-cyan-700 tracking-wider">
                                                {c.name}
                                            </span>
                                        ))}
                                    </div>
                                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight mb-4 group-hover:text-cyan-700 transition-colors">
                                        {featured.title}
                                    </h2>
                                    <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-1 line-clamp-3">
                                        {stripHtml(featured.content)}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                                            <span className="flex items-center gap-1">
                                                <CalendarDaysIcon className="w-4 h-4" /> {formatDate(featured.createdAt)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <TagIcon className="w-4 h-4" /> {readTime(featured.content)}
                                            </span>
                                        </div>
                                        <button className="inline-flex items-center gap-2 bg-slate-900 hover:bg-cyan-600 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all duration-300 hover:gap-3">
                                            Read Article <ArrowRightIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Category Filter Tabs ──────────────────────────── */}
                    <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 mt-14">
                        <div className="flex flex-wrap gap-2 md:gap-3">
                            {allCategories.map(cat => (
                                <button
                                    key={cat}
                                    id={`filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest border transition-all duration-200
                                        ${activeCategory === cat
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-900'}`}
                                >
                                    {cat}
                                    {cat !== 'All' && (
                                        <span className="ml-2 text-[10px] opacity-60">
                                            ({articles.slice(1).filter(a => a.categories.some(c => c.name === cat)).length})
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Article Grid ──────────────────────────────────── */}
                    <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 mt-10">
                        {filtered.length === 0 ? (
                            <div className="text-center py-20 text-slate-400">
                                <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                <p className="font-medium">Không tìm thấy bài viết phù hợp.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {filtered.map(item => (
                                    <ArticleCard
                                        key={item.id}
                                        item={item}
                                        onClick={() => navigate(`/news/${item.id}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Article Card ─────────────────────────────────────────────────────────────

function ArticleCard({ item, onClick }: { item: ArticleItem; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="bg-white group overflow-hidden flex flex-col shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 hover:border-transparent hover:-translate-y-1 cursor-pointer"
        >
            <div className="relative h-56 overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors z-10" />
                <img
                    src={item.thumbnailUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                    alt={item.title}
                    className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                />
                {item.categories[0] && (
                    <div className="absolute top-4 left-4 z-20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-slate-800 text-white">
                        {item.categories[0].name}
                    </div>
                )}
            </div>
            <div className="p-7 flex flex-col flex-1">
                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4">
                    <span className="flex items-center gap-1">
                        <CalendarDaysIcon className="w-3.5 h-3.5" /> {formatDate(item.createdAt)}
                    </span>
                    <span>•</span>
                    <span>{readTime(item.content)}</span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-3 leading-snug group-hover:text-cyan-700 transition-colors line-clamp-2">
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.title) }} />
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.content) }} />
                </p>
                <span className="inline-flex items-center self-start gap-2 text-xs font-bold uppercase tracking-widest text-slate-900 border-b-2 border-cyan-500 pb-0.5 group-hover:text-cyan-600 group-hover:gap-3 transition-all">
                    Read More <ArrowRightIcon className="w-3.5 h-3.5" />
                </span>
            </div>
        </div>
    );
}