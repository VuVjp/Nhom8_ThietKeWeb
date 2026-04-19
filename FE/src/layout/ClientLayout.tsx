import { Outlet, Link, useLocation } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export function ClientLayout() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    // Mock auth state for UI
    const isClientLoggedIn = localStorage.getItem('client_auth_mock') === 'true';

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMobileMenuOpen(false);
        window.scrollTo(0, 0);
    }, [location]);

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Rooms & Suites', href: '/rooms' },
        { name: 'Services', href: '/services' },
        { name: 'Attractions', href: '/attractions' },
        { name: 'Memberships', href: '/memberships' },
        { name: 'News', href: '/news' },
        { name: 'About', href: '/about' },
    ];

    return (
        <div className="min-h-screen flex flex-col font-['Manrope'] bg-[#F9FAFB] text-slate-800">
            {/* Elegant Header */}
            <header
                className={`fixed top-0 w-full z-50 transition-all duration-500 ease-in-out ${
                    isScrolled 
                        ? 'bg-white/90 backdrop-blur-xl shadow-sm py-3 border-b border-gray-100' 
                        : 'bg-transparent py-6'
                }`}
            >
                <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 object-contain">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Link to="/" className={`text-3xl font-extrabold tracking-tight transform transition hover:scale-105 ${isScrolled ? 'text-slate-900 bg-none' : 'text-white drop-shadow-md'}`}>
                                Grandeur <span className="font-light">Hotel</span>
                            </Link>
                        </div>

                        <nav className={`hidden lg:flex gap-8 items-center px-8 py-3 rounded-full border transition-all duration-500 ${isScrolled ? 'bg-slate-50/50 backdrop-blur-lg border-slate-200' : 'bg-white/10 backdrop-blur-md border-white/20 text-white'}`}>
                            {navLinks.map((link) => {
                                const isActive = location.pathname === link.href || (link.href !== '/' && location.pathname.startsWith(link.href));
                                return (
                                <Link
                                    key={link.name}
                                    to={link.href}
                                    className={`text-[13px] font-bold uppercase tracking-widest transition-colors hover:text-cyan-500 ${
                                        isActive 
                                            ? 'text-cyan-500' 
                                            : isScrolled ? 'text-slate-700' : 'text-slate-200'
                                    }`}
                                >
                                    {link.name}
                                </Link>
                            )})}
                        </nav>

                        <div className="hidden lg:flex items-center gap-6">
                            {isClientLoggedIn ? (
                                <Link to="/account" className={`text-sm font-semibold transition-colors ${isScrolled ? 'text-slate-700 hover:text-cyan-600' : 'text-white hover:text-cyan-300 drop-shadow-md'}`}>
                                    My Account
                                </Link>
                            ) : (
                                <Link to="/login" className={`text-sm font-semibold transition-colors ${isScrolled ? 'text-slate-700 hover:text-cyan-600' : 'text-white hover:text-cyan-300 drop-shadow-md'}`}>
                                    Sign In
                                </Link>
                            )}
                            
                            <Link
                                to="/rooms"
                                className="bg-[#1C1917] hover:bg-cyan-700 text-white px-7 py-3 rounded-none text-xs tracking-widest uppercase font-bold transition-all shadow-[4px_4px_0px_#0891b2] hover:shadow-[6px_6px_0px_#0891b2] hover:-translate-y-0.5 active:scale-95"
                            >
                                Book Now
                            </Link>
                        </div>

                        <div className="lg:hidden flex items-center">
                            <button
                                type="button"
                                className={`p-2 rounded-none border transition-colors ${isScrolled ? 'text-slate-800 border-slate-300 hover:bg-slate-100' : 'text-white border-white/40 bg-white/10 backdrop-blur hover:bg-white/20'}`}
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="lg:hidden absolute top-full left-0 w-full h-[100vh] bg-white border-t border-slate-100 shadow-2xl py-6 px-6 flex flex-col gap-4 z-40 overflow-y-auto">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.href}
                                className={`text-xl font-medium tracking-tight p-3 border-b border-slate-100 transition-all ${location.pathname === link.href ? 'text-cyan-600' : 'text-slate-900'}`}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="mt-8">
                            <Link to="/rooms" className="block w-full text-center bg-cyan-800 text-white py-4 text-sm tracking-widest uppercase font-bold transition-colors">
                                Book Your Stay
                            </Link>
                            <Link to={isClientLoggedIn ? "/account" : "/login"} className="block w-full text-center border border-slate-300 text-slate-800 py-4 mt-4 text-sm tracking-widest uppercase font-bold transition-colors">
                                {isClientLoggedIn ? "Account Dashboard" : "Sign In / Register"}
                            </Link>
                            <Link to="/admin" className="block w-full text-center text-slate-400 font-medium py-6 hover:text-cyan-600 transition-colors text-sm">
                                Staff Portal
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-1 flex flex-col">
                <Outlet />
            </main>

            {/* Comprehensive Premium Footer */}
            <footer className="bg-[#111827] text-slate-300 pt-24 pb-12 border-t border-[#1F2937]">
                <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
                        {/* Brand Column */}
                        <div className="lg:col-span-2">
                            <Link to="/" className="text-3xl font-extrabold tracking-tight text-white mb-6 block">
                                Grandeur <span className="font-light">Hotel</span>
                            </Link>
                            <p className="text-slate-400 text-[15px] leading-relaxed mb-8 max-w-sm">
                                Experience unparalleled luxury and comfort at our premium destination. A world-class standard in hospitality where every detail is crafted for your perfect getaway.
                            </p>
                            <div className="flex gap-4">
                                {/* Social Icons Placeholders */}
                                <div className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center hover:bg-cyan-600 hover:border-cyan-600 transition-colors cursor-pointer text-white">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                                </div>
                                <div className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center hover:bg-cyan-600 hover:border-cyan-600 transition-colors cursor-pointer text-white">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                                </div>
                                <div className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center hover:bg-cyan-600 hover:border-cyan-600 transition-colors cursor-pointer text-white">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="lg:col-span-1">
                            <h3 className="text-white font-bold mb-6 text-base">Quick Links</h3>
                            <ul className="space-y-4 text-[15px]">
                                <li><Link to="/about" className="hover:text-cyan-400 transition-colors">About Us</Link></li>
                                <li><Link to="/rooms" className="hover:text-cyan-400 transition-colors">Our Rooms</Link></li>
                                <li><Link to="/services" className="hover:text-cyan-400 transition-colors">Hotel Services</Link></li>
                                <li><Link to="/attractions" className="hover:text-cyan-400 transition-colors">Attractions</Link></li>
                                <li><Link to="/memberships" className="hover:text-cyan-400 transition-colors">Club Membership</Link></li>
                                <li><Link to="/news" className="hover:text-cyan-400 transition-colors">Latest News</Link></li>
                            </ul>
                        </div>

                        {/* Contact Information */}
                        <div className="lg:col-span-1">
                            <h3 className="text-white font-bold mb-6 text-base">Contact Us</h3>
                            <ul className="space-y-4 text-[15px] text-slate-400">
                                <li>123 Grandeur Boulevard, Oceanfront, CA 90210</li>
                                <li className="text-white">📞 +1 (800) 123-4567</li>
                                <li className="text-white">✉️ checkin@grandeur.com</li>
                            </ul>
                            <div className="mt-6 bg-slate-800/50 p-4 rounded-lg inline-block border border-slate-700/50">
                                <span className="block text-xs uppercase tracking-widest text-cyan-500 font-bold mb-1">Check-in / Out</span>
                                <span className="text-sm text-slate-300">14:00 PM / 12:00 PM</span>
                            </div>
                        </div>

                        {/* Newsletter */}
                        <div className="lg:col-span-1">
                            <h3 className="text-white font-bold mb-6 text-base">Newsletter</h3>
                            <p className="text-[15px] text-slate-400 mb-4">Subscribe to receive exclusive offers and updates on special events.</p>
                            <form className="flex flex-col gap-3">
                                <input
                                    type="email"
                                    placeholder="Your email address"
                                    className="bg-slate-900 border border-slate-700 text-white rounded-none px-4 py-3 w-full text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-sans"
                                />
                                <button type="button" onClick={() => toast.success('Thank you for subscribing!')} className="bg-white hover:bg-cyan-50 text-slate-900 px-4 py-3 rounded-none text-sm uppercase tracking-widest font-bold transition-colors w-full">
                                    Subscribe
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="border-t border-[#1F2937] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs tracking-wider text-slate-500">
                        <p>&copy; {new Date().getFullYear()} GRANDEUR HOTEL. ALL RIGHTS RESERVED.</p>
                        <div className="flex gap-6">
                            <span className="hover:text-cyan-400 cursor-pointer transition-colors uppercase">Privacy Policy</span>
                            <span className="hover:text-cyan-400 cursor-pointer transition-colors uppercase">Terms of Use</span>
                            <Link to="/admin" className="hover:text-slate-300 cursor-pointer transition-colors uppercase">Staff Portal</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
