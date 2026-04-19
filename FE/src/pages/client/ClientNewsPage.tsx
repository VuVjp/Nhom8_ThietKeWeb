

export function ClientNewsPage() {
    const news = [
        {
            id: 1,
            title: 'Summer Promotion 2026',
            description: 'Enjoy a 20% discount on all suites this summer. Special packages included for extended stays.',
            date: '01/06/2026',
            category: 'Offers',
            img: 'https://images.unsplash.com/photo-1540555600477-8cd28148b598?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
        },
        {
            id: 2,
            title: 'New Luxury Spa Opening',
            description: 'Experience our brand-new spa services featuring organic ingredients and holistic therapies from top specialists.',
            date: '15/05/2026',
            category: 'Announcements',
            img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
        },
        {
            id: 3,
            title: 'Top Attractions Near Our Hotel',
            description: 'Discover the best places around our location, carefully curated by our expert concierge service.',
            date: '10/05/2026',
            category: 'Guide',
            img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
        },
        {
            id: 4,
            title: 'Exclusive Wine Tasting Event',
            description: 'Join us for an evening of fine wines and gourmet pairings at The Azure Restaurant this weekend.',
            date: '05/05/2026',
            category: 'Events',
            img: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
        }
    ];

    return (
        <div className="w-full bg-[#f9fafb] text-slate-800 pb-24 font-sans min-h-screen">
            {/* Header spacer */}
            <div className="pt-[140px] pb-16 bg-white border-b border-slate-200">
                <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 text-center">
                    <span className="text-cyan-600 font-bold tracking-[0.2em] uppercase text-xs mb-4 block">The Grandeur Journal</span>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900">Latest News & Offers</h1>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 mt-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    
                    {/* Featured Article takes 2 columns usually, but let's just make it normal grid */}
                    {news.map((item, idx) => (
                        <div key={item.id} className={`bg-white rounded-none border border-slate-100 group overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col ${idx === 0 ? 'lg:col-span-2' : ''}`}>
                            <div className={`relative ${idx === 0 ? 'h-96' : 'h-64'} overflow-hidden`}>
                                <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors z-10" />
                                <div className="absolute top-4 left-4 z-20 bg-cyan-600 text-white px-3 py-1 font-bold text-xs uppercase tracking-widest">
                                    {item.category}
                                </div>
                                <img 
                                    src={item.img} 
                                    alt={item.title}
                                    className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                                />
                            </div>
                            <div className="p-8 flex-1 flex flex-col">
                                <span className="text-slate-400 font-bold text-xs tracking-widest uppercase mb-3 block">{item.date}</span>
                                <h3 className={`${idx === 0 ? 'text-3xl' : 'text-2xl'} font-bold mb-4 text-slate-900`}>{item.title}</h3>
                                <p className="text-slate-500 text-sm mb-8 flex-1 leading-relaxed">{item.description}</p>
                                
                                <button className="inline-flex items-center self-start font-bold text-slate-900 border-b-2 border-cyan-500 pb-1 hover:text-cyan-600 transition-colors uppercase tracking-widest text-xs">
                                    Read More <span className="ml-2">→</span>
                                </button>
                            </div>
                        </div>
                    ))}
                    
                </div>
                
                <div className="mt-16 text-center">
                    <button className="bg-slate-900 hover:bg-cyan-600 text-white px-8 py-4 text-xs font-bold uppercase tracking-widest transition-colors shadow-lg">
                        Load More Articles
                    </button>
                </div>
            </div>
        </div>
    );
}
