import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { ArticleCategory } from '../types/article.types';

interface CategoryMultiSelectProps {
    categories: ArticleCategory[];
    selected: number[];
    onChange: (ids: number[]) => void;
    placeholder?: string;
}

export function CategoryMultiSelect({
    categories,
    selected,
    onChange,
    placeholder = 'Select categories...',
}: CategoryMultiSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedCategories = categories.filter((c) => selected.includes(c.id));
    const filtered = categories.filter(
        (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) && !selected.includes(c.id),
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

    const toggle = (id: number) => {
        if (selected.includes(id)) {
            onChange(selected.filter((s) => s !== id));
        } else {
            onChange([...selected, id]);
        }
    };

    const remove = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selected.filter((s) => s !== id));
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger */}
            <div
                role="button"
                tabIndex={0}
                onClick={() => setOpen((v) => !v)}
                onKeyDown={(e) => e.key === 'Enter' && setOpen((v) => !v)}
                className="flex min-h-10 w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 transition focus:border-slate-300 focus:shadow-sm"
            >
                {selectedCategories.length === 0 ? (
                    <span className="text-slate-400">{placeholder}</span>
                ) : (
                    selectedCategories.map((cat) => (
                        <span
                            key={cat.id}
                            className="inline-flex items-center gap-1 rounded-full bg-cyan-50 border border-cyan-200 px-2 py-0.5 text-xs font-medium text-cyan-700"
                        >
                            {cat.name}
                            <button
                                type="button"
                                onClick={(e) => remove(cat.id, e)}
                                className="ml-0.5 rounded-full p-0.5 hover:bg-cyan-100"
                            >
                                <XMarkIcon className="h-3 w-3" />
                            </button>
                        </span>
                    ))
                )}
                <ChevronDownIcon
                    className={`ml-auto h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
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
                            className="w-full bg-transparent text-sm outline-none text-slate-800 placeholder:text-slate-400"
                        />
                    </div>
                    <ul className="max-h-48 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <li className="px-3 py-2 text-xs text-slate-400">No categories found</li>
                        ) : (
                            filtered.map((cat) => (
                                <li
                                    key={cat.id}
                                    role="option"
                                    aria-selected={false}
                                    onClick={() => toggle(cat.id)}
                                    className="cursor-pointer px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
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
