    import { useCallback, useEffect, useMemo, useState } from 'react';
import { PlusIcon, TrashIcon, PencilSquareIcon, MapPinIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Input } from '../../components/Input';
import { Table } from '../../components/Table';
import { Pagination } from '../../components/Pagination';
import { Modal } from '../../components/Modal';
import { attractionsApi, type Attraction } from '../../api/attractionsApi';
import { paginate, queryIncludes } from '../../utils/table';
import { toApiError } from '../../api/httpClient';
import { ImageUpload } from '../../components/ImageUpload';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

const HOTEL_LAT = 10.9539722; // 10°57'14.3"N
const HOTEL_LNG = 106.8019444; // 106°48'07.0"E

function calculateDistanceAsKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
}

function MapLocationPicker({ position, onLocationSelect }: { position: [number, number] | null, onLocationSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return position ? <Marker position={position} /> : null;
}

export function AttractionsPage() {
    const [attractions, setAttractions] = useState<Attraction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const [openModal, setOpenModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Attraction | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form Draft
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [distanceKm, setDistanceKm] = useState<number | ''>('');
    const [isActive, setIsActive] = useState(true);
    const [mapEmbedLink, setMapEmbedLink] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearchingMap, setIsSearchingMap] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (!name.trim()) {
            setSuggestions([]);
            return;
        }
        const timer = setTimeout(async () => {
            if (openModal && showSuggestions) {
                setIsSearchingMap(true);
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(name.trim())}`);
                    const data = await res.json();
                    setSuggestions(data);
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsSearchingMap(false);
                }
            }
        }, 600);
        return () => clearTimeout(timer);
    }, [name, openModal, showSuggestions]);

    useEffect(() => {
        const lat = Number(latitude);
        const lng = Number(longitude);
        if (latitude !== '' && longitude !== '' && !isNaN(lat) && !isNaN(lng)) {
            const dist = calculateDistanceAsKm(HOTEL_LAT, HOTEL_LNG, lat, lng);
            setDistanceKm(dist);
        }
    }, [latitude, longitude]);

    const loadAttractions = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await attractionsApi.getAll();
            setAttractions(data);
        } catch (error) {
            toast.error(toApiError(error).message || 'Failed to load attractions');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadAttractions();
    }, [loadAttractions]);

    const filtered = useMemo(() => {
        return attractions.filter(item => queryIncludes(item.name, search) || queryIncludes(item.description ?? '', search));
    }, [attractions, search]);

    const pageSize = 10;
    const paged = paginate(filtered, page, pageSize);

    const columns = [
        {
            key: 'image',
            label: 'Image',
            render: (row: Attraction) => (
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                    {row.imageUrl ? (
                        <img src={row.imageUrl} alt={row.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <MapPinIcon className="h-6 w-6" />
                        </div>
                    )}
                </div>
            )
        },
        { key: 'name', label: 'Attraction', render: (row: Attraction) => {
            const mapLink = row.latitude && row.longitude && !isNaN(Number(row.latitude)) 
                ? `https://www.google.com/maps/search/?api=1&query=${row.latitude},${row.longitude}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row.name)}`;
            return (
                <div>
                    <a 
                        href={mapLink}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-slate-800 hover:text-cyan-700 hover:underline block transition-colors"
                        title="View on Google Maps"
                    >
                        {row.name}
                    </a>
                    <span className="text-xs text-slate-500 line-clamp-1">{row.description}</span>
                </div>
            );
        } },
        { key: 'distance', label: 'Distance', render: (row: Attraction) => row.distanceKm ? `${row.distanceKm} km` : '-' },
        { key: 'status', label: 'Status', render: (row: Attraction) => (
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${row.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                {row.isActive ? 'Active' : 'Inactive'}
            </span>
        ) },
        {
            key: 'actions',
            label: 'Actions',
            render: (row: Attraction) => {
                const mapLink = row.latitude && row.longitude && !isNaN(Number(row.latitude)) 
                    ? `https://www.google.com/maps/search/?api=1&query=${row.latitude},${row.longitude}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row.name)}`;
                return (
                    <div className="flex gap-2">
                        <a href={mapLink} target="_blank" rel="noreferrer" className="rounded hover:text-cyan-700 text-slate-500" title="View/Search on Map">
                            <MapPinIcon className="h-5 w-5" />
                        </a>
                        <button
                            type="button"
                            className="rounded hover:text-cyan-700 text-slate-500"
                            onClick={() => openEdit(row)}
                            title="Edit"
                        >
                            <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            className="rounded hover:text-red-700 text-slate-500"
                            onClick={() => handleDelete(row.id)}
                            title="Delete"
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    </div>
                );
            }
        }
    ];

    const openCreate = () => {
        setEditingItem(null);
        setName('');
        setDescription('');
        setDistanceKm('');
        setIsActive(true);
        setMapEmbedLink('');
        setLatitude('');
        setLongitude('');
        setFile(null);
        setPreviewUrl(null);
        setSuggestions([]);
        setShowSuggestions(false);
        setOpenModal(true);
    };

    const openEdit = (item: Attraction) => {
        setEditingItem(item);
        setName(item.name);
        setDescription(item.description ?? '');
        setDistanceKm(item.distanceKm ?? '');
        setIsActive(item.isActive);
        setMapEmbedLink(item.mapEmbedLink ?? '');
        setLatitude(item.latitude);
        setLongitude(item.longitude);
        setFile(null);
        setPreviewUrl(item.imageUrl || null);
        setSuggestions([]);
        setShowSuggestions(false);
        setOpenModal(true);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Attraction name is required');
            return;
        }

        setIsSaving(true);
        try {
            const data = {
                name: name.trim(),
                description: description.trim(),
                distanceKm: distanceKm === '' ? undefined : Number(distanceKm),
                isActive,
                mapEmbedLink: mapEmbedLink.trim(),
                latitude: latitude.trim(),
                longitude: longitude.trim(),
                ...(file && { file })
            };

            if (editingItem) {
                await attractionsApi.update(editingItem.id, data);
                toast.success('Attraction updated');
            } else {
                await attractionsApi.create(data);
                toast.success('Attraction created');
            }
            setOpenModal(false);
            void loadAttractions();
        } catch (error) {
            toast.error(toApiError(error).message || 'Failed to save attraction');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this attraction?')) return;
        try {
            await attractionsApi.delete(id);
            toast.success('Attraction deleted');
            void loadAttractions();
        } catch (error) {
            toast.error(toApiError(error).message || 'Failed to delete attraction');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Attractions</h2>
                    <p className="text-sm text-slate-500">Manage nearby local attractions for guests.</p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
                >
                    <PlusIcon className="h-4 w-4" /> Add Attraction
                </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
                <div className="w-full max-w-sm">
                    <Input
                        placeholder="Search attraction name or description..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                    Loading attractions...
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                    No attractions found.
                </div>
            ) : (
                <>
                    <Table columns={columns} rows={paged} />
                    <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
                </>
            )}

            <Modal
                title={editingItem ? 'Edit Attraction' : 'Add Attraction'}
                open={openModal}
                onClose={() => setOpenModal(false)}
            >
                <div className="space-y-4">
                    <div className="space-y-2 relative">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-700">Name <span className="text-red-500">*</span></label>
                            <a 
                                href={latitude && longitude ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}` : (name.trim() ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name.trim())}` : 'https://www.google.com/maps')}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-cyan-600 hover:text-cyan-800 hover:underline flex items-center gap-1"
                                title={latitude && longitude ? "View coordinates on Google Maps" : (name.trim() ? "Search this name on Google Maps" : "Open Google Maps")}
                            >
                                <MapPinIcon className="h-3 w-3" />
                                Search on Map App
                            </a>
                        </div>
                        <Input 
                            value={name} 
                            onChange={(e) => {
                                setName(e.target.value);
                                setShowSuggestions(true);
                            }} 
                            onFocus={() => setShowSuggestions(true)}
                            placeholder="e.g. Central Park" 
                            autoComplete="off"
                        />
                        {showSuggestions && (suggestions.length > 0 || isSearchingMap) && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                                {isSearchingMap ? (
                                    <div className="px-4 py-3 text-sm text-slate-500">Searching map locations...</div>
                                ) : (
                                    <ul className="max-h-60 overflow-auto">
                                        {suggestions.map((s, idx) => (
                                            <li 
                                                key={idx}
                                                className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                                                onClick={() => {
                                                    const placeName = s.name || s.display_name.split(',')[0];
                                                    setName(placeName);
                                                    setLatitude(s.lat);
                                                    setLongitude(s.lon);
                                                    setMapEmbedLink(`https://maps.google.com/maps?q=${s.lat},${s.lon}&t=&z=15&ie=UTF8&iwloc=&output=embed`);
                                                    setShowSuggestions(false);
                                                }}
                                            >
                                                <div className="font-medium text-slate-800">{s.name || s.display_name.split(',')[0]}</div>
                                                <div className="text-xs text-slate-500 truncate">{s.display_name}</div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Description</label>
                        <textarea
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none ring-cyan-500 transition focus:ring-2"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Image</label>
                        <ImageUpload
                            value={file}
                            onChange={(val) => setFile(Array.isArray(val) ? val[0] : val)}
                            currentUrl={previewUrl || undefined}
                            label="Click or drag image to upload"
                        />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Distance (km)</label>
                            <Input type="number" step="0.1" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g. 1.5" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Status</label>
                            <label className="flex items-center gap-2 pt-2 cursor-pointer">
                                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-slate-300" />
                                <span className="text-sm text-slate-700">{isActive ? 'Active (Visible)' : 'Inactive'}</span>
                            </label>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Pick Location on Map</label>
                        <div className="w-full h-48 rounded-lg border border-slate-200 overflow-hidden relative z-0">
                            <MapContainer center={latitude && longitude && !isNaN(Number(latitude)) && !isNaN(Number(longitude)) ? [Number(latitude), Number(longitude)] : [HOTEL_LAT, HOTEL_LNG]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution="&copy; OpenStreetMap"
                                />
                                <MapLocationPicker 
                                    position={latitude && longitude && !isNaN(Number(latitude)) && !isNaN(Number(longitude)) ? [Number(latitude), Number(longitude)] : null}
                                    onLocationSelect={async (lat, lng) => {
                                        setLatitude(String(lat));
                                        setLongitude(String(lng));
                                        setMapEmbedLink(`https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`);
                                        
                                        try {
                                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                                            const data = await res.json();
                                            if (data && data.display_name) {
                                                const placeName = data.name || data.display_name.split(',')[0];
                                                setName((prev) => prev ? prev : placeName);
                                            }
                                        } catch(e) {}
                                    }}
                                />
                            </MapContainer>
                        </div>
                        <p className="text-xs text-slate-500">Click anywhere on the map to set location automatically.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Latitude</label>
                            <Input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="e.g. 40.7829" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Longitude</label>
                            <Input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="e.g. -73.9654" />
                        </div>
                    </div>
                    {/* <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Map Embed Link</label>
                        <Input value={mapEmbedLink} onChange={(e) => setMapEmbedLink(e.target.value)} placeholder="e.g. https://maps.example.com/embed" />
                        {mapEmbedLink && (
                            <div className="mt-2 w-full h-32 rounded-lg border border-slate-200 overflow-hidden relative bg-slate-100 flex items-center justify-center">
                                <iframe 
                                    src={mapEmbedLink.replace('watch?v=', 'embed/')} 
                                    className="w-full h-full border-0" 
                                    title="Map Preview"
                                    allowFullScreen
                                />
                            </div>
                        )}
                    </div> */}
                    
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={() => setOpenModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
                        <button type="button" onClick={handleSave} disabled={isSaving} className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60">
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
