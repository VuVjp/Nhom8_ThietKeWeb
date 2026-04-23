

export function ClientAboutPage() {
    return (
        <div className="w-full bg-white text-slate-800 pb-24 font-sans min-h-screen">
            {/* HERO SECTION */}
            <div className="relative h-[60vh] w-full bg-slate-900 flex items-center justify-center">
                <img
                    src="https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?q=80&w=1752&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="About Us"
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-10" />

                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                    <span className="text-cyan-400 font-bold tracking-[0.3em] uppercase text-xs md:text-sm mb-4 block drop-shadow-md">The Grandeur Legacy</span>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-lg">
                        Our Story
                    </h1>
                </div>
            </div>

            <div className="max-w-[1000px] mx-auto px-6 sm:px-8 lg:px-12 mt-20 text-center">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-8">Redefining Luxury Hospitality</h2>
                <p className="text-lg text-slate-600 leading-relaxed mb-12">
                    Grandeur is a luxury hotel offering world-class service, modern facilities, and unforgettable experiences. Founded on the principle that true luxury lies in the details, we have dedicated ourselves to anticipating the needs of our discerning guests before they even arise.
                </p>
                <div className="h-px w-24 bg-cyan-500 mx-auto mb-16"></div>
            </div>

            {/* VISION & MISSION */}
            <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 mb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="bg-[#f9fafb] p-12 rounded-2xl border border-slate-100 flex flex-col justify-center">
                        <span className="text-cyan-600 font-bold tracking-widest uppercase text-xs mb-4 block">Our Vision</span>
                        <h3 className="text-2xl font-bold text-slate-900 mb-6">Leading the Region</h3>
                        <p className="text-slate-600 leading-relaxed">
                            To become the leading luxury hotel brand in the region, recognized globally for perfectly blending innovative modern design with timeless, heartfelt hospitality.
                        </p>
                    </div>
                    <div className="bg-slate-900 text-white p-12 rounded-2xl flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600 rounded-full filter blur-3xl opacity-20 -mr-20 -mt-20"></div>
                        <span className="text-cyan-400 font-bold tracking-widest uppercase text-xs mb-4 block relative z-10">Our Mission</span>
                        <h3 className="text-2xl font-bold mb-6 relative z-10">Exceptional Comfort</h3>
                        <p className="text-slate-300 leading-relaxed relative z-10">
                            Deliver exceptional hospitality and absolute comfort to every guest. We strive to create an environment where every interaction leaves a memorable, positive impact.
                        </p>
                    </div>
                </div>
            </div>

            {/* CORE VALUES */}
            <div className="bg-slate-50 py-24 border-y border-slate-100">
                <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 text-center">
                    <span className="text-cyan-600 font-bold tracking-widest uppercase text-xs mb-4 block">Our Philosophy</span>
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-16">Core Values</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                            <h4 className="text-xl font-bold text-slate-900 mb-4">Quality</h4>
                            <p className="text-sm text-slate-500">Uncompromising standards in every amenity and service we provide.</p>
                        </div>
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                            <h4 className="text-xl font-bold text-slate-900 mb-4">Comfort</h4>
                            <p className="text-sm text-slate-500">Designing spaces that feel like a luxurious extension of your home.</p>
                        </div>
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                            <h4 className="text-xl font-bold text-slate-900 mb-4">Trust</h4>
                            <p className="text-sm text-slate-500">Building lasting relationships through transparency and reliability.</p>
                        </div>
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                            <h4 className="text-xl font-bold text-slate-900 mb-4">Innovation</h4>
                            <p className="text-sm text-slate-500">Constantly evolving to exceed modern expectations and technological trends.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ACHIEVEMENTS */}
            <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-24 text-center">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                    <div className="flex flex-col items-center pt-8 md:pt-0">
                        <div className="text-5xl font-extrabold text-cyan-600 mb-4 flex items-center gap-2">5 <span className="text-3xl">★</span></div>
                        <span className="text-slate-900 font-bold uppercase tracking-widest text-sm">Rating Excellence</span>
                        <p className="text-slate-500 text-sm mt-3">Consistently rated 5-stars by global agencies.</p>
                    </div>
                    <div className="flex flex-col items-center pt-8 md:pt-0">
                        <div className="text-5xl font-extrabold text-cyan-600 mb-4">10+</div>
                        <span className="text-slate-900 font-bold uppercase tracking-widest text-sm">Years Experience</span>
                        <p className="text-slate-500 text-sm mt-3">Over a decade of hospitality leadership.</p>
                    </div>
                    <div className="flex flex-col items-center pt-8 md:pt-0">
                        <div className="text-5xl font-extrabold text-cyan-600 mb-4">10k+</div>
                        <span className="text-slate-900 font-bold uppercase tracking-widest text-sm">Happy Customers</span>
                        <p className="text-slate-500 text-sm mt-3">Thousands of unforgettable guest experiences.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
