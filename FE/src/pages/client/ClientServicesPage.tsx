import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { servicesApi } from '../../api/servicesApi';
import type { Service } from '../../types/models';

export function ClientServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const result = await servicesApi.getPaged({
                    page: 1,
                    pageSize: 50, // Get a reasonable amount for client display
                    isActive: true
                });
                setServices(result.items);
            } catch (error) {
                console.error('Failed to fetch services:', error);
                toast.error('Failed to load services. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        void fetchServices();
    }, []);

    const parseFeatures = (featuresStr?: string) => {
        if (!featuresStr) return [];
        return featuresStr.split(/[;,]/).map(f => f.trim()).filter(f => f !== '');
    };

    if (isLoading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium">Loading luxury experiences...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-white text-slate-800 pb-24 font-sans">
            {/* HERo/LARGETHUMBNAIL SECTION */}
            <div className="relative h-[60vh] w-full bg-slate-900 mt-[0px] flex items-center justify-center">
                <img
                    src="https://images.unsplash.com/photo-1641924676093-42e61835bbe2?q=80&w=1742&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Services"
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                    <span className="text-cyan-400 font-bold tracking-[0.3em] uppercase text-xs md:text-sm mb-4 block">World-Class Amenities</span>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-lg">
                        Elevate Your Stay
                    </h1>
                    <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                        Indulge in a curated selection of premium services designed to provide you with the ultimate luxury experience.
                    </p>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 mt-20">
                {services.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <p className="text-slate-500 italic">No services currently available. Please check back soon.</p>
                    </div>
                ) : (
                    <div className="space-y-24">
                        {services.map((svc, idx) => {
                            const features = parseFeatures(svc.features);
                            return (
                                <div key={svc.id} className={`flex flex-col md:flex-row gap-12 items-center ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                                    {/* Image side */}
                                    <div className="w-full md:w-1/2">
                                        <div className="relative group overflow-hidden shadow-2xl rounded-2xl">
                                            <div className="absolute inset-0 bg-cyan-900/10 group-hover:bg-transparent transition-colors duration-500 z-10" />
                                            {svc.imageUrl ? (
                                                <img
                                                    src={svc.imageUrl}
                                                    alt={svc.name}
                                                    className="w-full h-[400px] object-cover transform transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-[400px] bg-slate-100 flex items-center justify-center text-slate-300">
                                                    <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                            {/* Price tag */}
                                            <div className="absolute bottom-6 left-6 z-20 bg-white/95 backdrop-blur px-6 py-3 font-bold text-slate-900 shadow-xl uppercase tracking-widest text-xs rounded-lg">
                                                ${svc.price.toLocaleString()} / {svc.unit}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content side */}
                                    <div className="w-full md:w-1/2 flex flex-col justify-center">
                                        <div className="flex items-center gap-4 mb-4">
                                            <span className="w-12 h-px bg-cyan-500 block"></span>
                                            <span className="text-cyan-600 font-bold tracking-widest uppercase text-xs">Service 0{idx + 1}</span>
                                        </div>
                                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">{svc.name}</h2>
                                        <p className="text-slate-600 leading-relaxed mb-8 text-lg">
                                            {svc.description || 'No description available for this luxury service.'}
                                        </p>

                                        {features.length > 0 && (
                                            <ul className="space-y-3 mb-10 text-sm font-semibold text-slate-700">
                                                {features.map((feature, i) => (
                                                    <li key={i} className="flex items-center gap-3">
                                                        <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        <div className="flex gap-4">
                                            <button 
                                                onClick={() => toast.success(`Booking request sent for ${svc.name}`)} 
                                                className="bg-slate-900 hover:bg-cyan-600 text-white px-8 py-4 text-xs font-bold uppercase tracking-widest transition-colors shadow-lg rounded-xl"
                                            >
                                                Book Service
                                            </button>
                                            <button 
                                                onClick={() => toast(`More details about ${svc.name}`)} 
                                                className="bg-white border-2 border-slate-200 hover:border-slate-900 text-slate-900 px-8 py-4 text-xs font-bold uppercase tracking-widest transition-colors rounded-xl"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="mt-32 max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 text-center bg-cyan-50 py-16 rounded-3xl border border-cyan-100">
                <h3 className="text-2xl font-bold mb-4">Not staying with us?</h3>
                <p className="text-slate-600 mb-6">Our Spa and Restaurant amenities are open to non-guests by reservation.</p>
                <Link to="/contact" className="inline-block border-b-2 border-cyan-500 text-slate-900 font-bold uppercase tracking-widest text-xs pb-1 hover:text-cyan-600 transition-colors">Contact Us for Reservations</Link>
            </div>
        </div>
    );
}
