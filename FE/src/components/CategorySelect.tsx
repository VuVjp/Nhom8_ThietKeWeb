import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface CategoryItem {
    id: number;
    name: string;
    isActive?: boolean;
}

interface CategorySelectProps {
    categories: CategoryItem[];
    selectedId: number | null | undefined;
    onChange: (id: number | null) => void;
    placeholder?: string;
}

export function CategorySelect({
    categories,
    selectedId,
    onChange,
    placeholder = 'All Categories',
}: CategorySelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedCategory = categories.find((c) => c.id === selectedId);
    
    // Filter by search string
    const filtered = categories.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const select = (id: number | null, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        onChange(id);
        setOpen(false);
        setSearch('');
    };

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Trigger */}
            <div
                role="button"
                tabIndex={0}
                onClick={() => setOpen((v) => !v)}
                onKeyDown={(e) => e.key === 'Enter' && setOpen((v) => !v)}
                className="flex h-9 w-full cursor-pointer items-center justify-between gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition focus:border-slate-300 focus:shadow-sm"
            >
                {selectedCategory ? (
                    <span className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{selectedCategory.name}</span>
                        <button
                            type="button"
                            onClick={(e) => select(null, e)}
                            className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            title="Clear"
                        >
                            <XMarkIcon className="h-3 w-3" />
                        </button>
                    </span>
                ) : (
                    <span className="text-slate-500">{placeholder}</span>
                )}
                <ChevronDownIcon
                    className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
                    <div className="border-b border-slate-100 px-3 py-2">
                        <input
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search categories..."
                            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                        />
                    </div>
                    <ul className="max-h-48 overflow-y-auto py-1">
                        {/* Always allow selecting 'None' if they search for empty or we have results */}
                        <li
                            role="option"
                            aria-selected={selectedId === null}
                            onClick={() => select(null)}
                            className={`cursor-pointer px-3 py-2 text-sm transition hover:bg-slate-50 ${selectedId === null ? 'bg-cyan-50 font-medium text-cyan-700 hover:bg-cyan-50' : 'text-slate-500'}`}
                        >
                            {placeholder}
                        </li>
                        
                        {filtered.length === 0 ? (
                            <li className="px-3 py-2 text-xs text-slate-400">No categories found</li>
                        ) : (
                            filtered.map((cat) => (
                                <li
                                    key={cat.id}
                                    role="option"
                                    aria-selected={selectedId === cat.id}
                                    onClick={(e) => select(cat.id, e)}
                                    className={`cursor-pointer px-3 py-2 text-sm transition hover:bg-slate-50 ${selectedId === cat.id ? 'bg-cyan-50 font-medium text-cyan-700 hover:bg-cyan-50' : 'text-slate-700'}`}
                                >
                                    {cat.name}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
