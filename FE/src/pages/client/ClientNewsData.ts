export type NewsCategory = 'All' | 'Hotel News' | 'Promotions' | 'Travel Guide' | 'Events' | 'Blog' | 'Recruitment';

export interface NewsItem {
    id: number;
    title: string;
    excerpt: string;
    date: string;
    category: NewsCategory;
    img: string;
    readTime: string;
    featured?: boolean;
    hot?: boolean;
}

export const newsData: NewsItem[] = [
    {
        id: 1,
        title: 'Grandeur Hotel Achieves International 5-Star Certification',
        excerpt: 'We are thrilled to announce that The Grandeur Hotel has been officially awarded the prestigious International 5-Star Hotel Certification by Forbes Travel Guide — recognizing our unwavering commitment to world-class hospitality, culinary excellence, and premium guest experiences.',
        date: '20/04/2026',
        category: 'Hotel News',
        img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        readTime: '4 min read',
        featured: true,
        hot: true,
    },
    {
        id: 2,
        title: 'Grand Opening: The Azure Infinity Rooftop Pool & Bar',
        excerpt: 'Step into paradise — our breathtaking new rooftop infinity pool and cocktail bar is now open, offering panoramic city views and an unmatched sky-high relaxation experience.',
        date: '15/04/2026',
        category: 'Hotel News',
        img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        readTime: '3 min read',
    },
    {
        id: 3,
        title: 'New Presidential Suite Collection: Redefining Luxury',
        excerpt: 'Introducing our newly renovated Presidential Suites — 320 sqm of pure opulence featuring butler service, private terrace, and bespoke interior design by renowned architect Marc Diaz.',
        date: '10/04/2026',
        category: 'Hotel News',
        img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        readTime: '3 min read',
    },
    {
        id: 4,
        title: 'Summer Escape 2026 – Up to 40% Off All Suites',
        excerpt: 'Make this summer unforgettable. Book any suite for a minimum of 2 nights and enjoy up to 40% off, complimentary breakfast for two, and a welcome bottle of premium Champagne.',
        date: '18/04/2026',
        category: 'Promotions',
        img: 'https://images.unsplash.com/photo-1540555600477-8cd28148b598?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        readTime: '2 min read',
        hot: true,
    },
    {
        id: 5,
        title: '3D2N Romantic Getaway Package – Couples Only',
        excerpt: 'Celebrate love with our exclusive couples package: 3 days 2 nights in a Deluxe Ocean View Suite, candlelit dinner, couples spa, and a sunset cruise — all-inclusive from $599.',
        date: '12/04/2026',
        category: 'Promotions',
        img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        readTime: '3 min read',
    },
    {
        id: 6,
        title: 'Early Bird Discount: Book 30 Days Ahead & Save 25%',
        excerpt: 'Plan ahead and reward yourself. Secure your stay at least 30 days in advance and receive an automatic 25% discount — applicable to all room types, year-round.',
        date: '08/04/2026',
        category: 'Promotions',
        img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        readTime: '2 min read',
    },
    {
        id: 7,
        title: 'Top 10 Must-Visit Attractions Within 5km of The Grandeur',
        excerpt: 'From hidden rooftop gardens to vibrant night markets and iconic landmarks — our expert concierge team has curated the ultimate local guide for your stay.',
        date: '14/04/2026',
        category: 'Travel Guide',
        img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        readTime: '6 min read',
    },
    {
        id: 8,
        title: 'What to Eat in Hồ Chí Minh City: A Luxury Food Guide',
        excerpt: "Discover where the city's finest chefs dine when they're off duty — from street-food gems to Michelin-level dining experiences, all handpicked by our culinary team.",
        date: '07/04/2026',
        category: 'Travel Guide',
        img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        readTime: '5 min read',
    },
    {
        id: 9,
        title: 'Grand Acoustic Night – Live Jazz at The Terrace Bar',
        excerpt: "Join us every Friday evening for an immersive live jazz experience under the stars. Featuring Grammy-nominated artists, craft cocktails, and our acclaimed tapas menu.",
        date: '25/04/2026',
        category: 'Events',
        img: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        readTime: '2 min read',
        hot: true,
    },
    {
        id: 10,
        title: 'International Business Summit 2026 – Venue Showcase',
        excerpt: "The Grandeur's Grand Ballroom is the official venue for the Asia Pacific Business Leaders Summit 2026, welcoming 500+ executives from 30 countries.",
        date: '30/05/2026',
        category: 'Events',
        img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        readTime: '3 min read',
    },
    {
        id: 11,
        title: "Mother's Day Brunch Buffet – Reserve Your Table Now",
        excerpt: 'Spoil Mum this year with an extravagant Sunday brunch at The Amber Restaurant — featuring 80+ dishes, live cooking stations, free-flow mimosas, and a floral gift for every mother.',
        date: '11/05/2026',
        category: 'Events',
        img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        readTime: '2 min read',
    },
    {
        id: 12,
        title: 'How to Choose the Perfect Hotel Room for Your Trip',
        excerpt: "City view or garden view? Twin or King? Our hospitality experts break down everything you need to know before booking — so you always get the room perfect for your stay.",
        date: '11/04/2026',
        category: 'Blog',
        img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        readTime: '5 min read',
    },
    {
        id: 13,
        title: `A Guest's Story: "My Perfect Weekend at Grandeur"`,
        excerpt: `"I never expected a city hotel to feel this peaceful…" — Read Emma's heartfelt journey from airport pickup to the final goodbye hug from our concierge team.`,
        date: '05/04/2026',
        category: 'Blog',
        img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        readTime: '7 min read',
    },
    {
        id: 14,
        title: "Join Our Team: We're Hiring for Multiple Positions",
        excerpt: "The Grandeur is expanding! We are looking for passionate hospitality professionals — Front Desk Agents, F&B Supervisors, Housekeeping Leads, and Event Coordinators. Apply now and grow with us.",
        date: '22/04/2026',
        category: 'Recruitment',
        img: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        readTime: '3 min read',
    },
];

export const categoryColors: Record<string, string> = {
    'Hotel News': 'bg-slate-700 text-white',
    'Promotions': 'bg-cyan-700 text-white',
    'Travel Guide': 'bg-slate-600 text-white',
    'Events': 'bg-slate-800 text-white',
    'Blog': 'bg-slate-500 text-white',
    'Recruitment': 'bg-slate-900 text-white',
};

export const categoryBadge: Record<string, string> = {
    'Hotel News': 'bg-slate-100 text-slate-700 border-slate-200',
    'Promotions': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'Travel Guide': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Events': 'bg-violet-50 text-violet-700 border-violet-200',
    'Blog': 'bg-amber-50 text-amber-700 border-amber-200',
    'Recruitment': 'bg-rose-50 text-rose-700 border-rose-200',
};

export const allCategories: NewsCategory[] = ['All', 'Hotel News', 'Promotions', 'Travel Guide', 'Events', 'Blog', 'Recruitment'];
