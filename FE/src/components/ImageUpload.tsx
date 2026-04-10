import React, { useRef, useState, useEffect } from 'react';
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ImageUploadProps {
    value: File | File[] | null;
    onChange: (value: File | File[] | null) => void;
    multiple?: boolean;
    currentUrl?: string | string[];
    className?: string;
    label?: string;
    disabled?: boolean;
    activeIndex?: number | string;
    onItemClick?: (id: number | string) => void;
    existingFiles?: { id: number; url: string; isPrimary?: boolean }[];
    onDeleteExisting?: (id: number) => void;
}

export function ImageUpload({
    value,
    onChange,
    multiple = false,
    currentUrl,
    className = '',
    label = 'Click or drag image to upload',
    disabled = false,
    activeIndex,
    onItemClick,
    existingFiles = [],
    onDeleteExisting
}: ImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const files = Array.isArray(value) ? value : value ? [value] : [];
        const newPreviews = files.map(file => URL.createObjectURL(file));
        
        setPreviews(newPreviews);

        return () => {
            newPreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [value]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        if (multiple) {
            const currentFiles = Array.isArray(value) ? value : value ? [value] : [];
            onChange([...currentFiles, ...Array.from(selectedFiles)]);
        } else {
            onChange(selectedFiles[0]);
        }
        
        // Reset input so the same file can be selected again if removed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (multiple && Array.isArray(value)) {
            const newFiles = [...value];
            newFiles.splice(index, 1);
            onChange(newFiles.length > 0 ? newFiles : null);
        } else {
            onChange(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (disabled) return;
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        if (disabled) return;
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = e.dataTransfer.files;
        if (!droppedFiles || droppedFiles.length === 0) return;

        if (multiple) {
            const currentFiles = Array.isArray(value) ? value : value ? [value] : [];
            onChange([...currentFiles, ...Array.from(droppedFiles)]);
        } else {
            onChange(droppedFiles[0]);
        }
    };

    // Determine what to show as "Existing" or "Current"
    const displayUrls = Array.isArray(currentUrl) ? currentUrl : currentUrl ? [currentUrl] : [];

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Multiple Mode Gallery - Shown ABOVE the upload trigger */}
            {multiple && (existingFiles.length > 0 || previews.length > 0) && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Existing images */}
                    {existingFiles.map((img) => {
                        const isActive = activeIndex === img.id || (activeIndex === undefined && img.isPrimary);
                        return (
                            <div 
                                key={`existing-${img.id}`} 
                                className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-300 
                                    ${isActive ? 'border-cyan-500 ring-4 ring-cyan-100' : 'border-slate-200 hover:border-slate-300 shadow-sm'}
                                `}
                                onClick={(e) => {
                                    if (onItemClick) {
                                        e.stopPropagation();
                                        onItemClick(img.id);
                                    }
                                }}
                                title="Click to set as primary"
                            >
                                <img src={img.url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className={`absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100 ${isActive ? 'ring-2 ring-inset ring-cyan-500' : ''}`} />
                                
                                {onDeleteExisting && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteExisting(img.id);
                                        }}
                                        className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-rose-600 shadow-sm backdrop-blur-sm transition-all hover:bg-rose-500 hover:text-white z-20"
                                        title="Delete image"
                                    >
                                        <XMarkIcon className="h-3.5 w-3.5" />
                                    </button>
                                )}
                                
                                <div className="absolute bottom-2 left-2 flex flex-col gap-1 z-10">
                                    <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md
                                        ${isActive ? 'bg-cyan-600 text-white' : 'bg-white/90 text-slate-700'}
                                    `}>
                                        {isActive ? '★ Primary' : 'Current'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* New images */}
                    {previews.map((url, i) => {
                        const selectionId = `new-${i}`;
                        const isActive = activeIndex === selectionId;
                        return (
                            <div 
                                key={selectionId} 
                                className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-300 
                                    ${isActive ? 'border-cyan-500 ring-4 ring-cyan-100' : 'border-slate-200 hover:border-slate-300 shadow-sm'}
                                `}
                                onClick={(e) => {
                                    if (onItemClick) {
                                        e.stopPropagation();
                                        onItemClick(selectionId);
                                    }
                                }}
                                title="Click to set as primary"
                            >
                                <img src={url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className={`absolute inset-0 bg-black/10 opacity-0 transition-opacity group-hover:opacity-100 ${isActive ? 'ring-2 ring-inset ring-cyan-500' : ''}`} />
                                
                                <button
                                    onClick={(e) => removeFile(i, e)}
                                    className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-rose-600 shadow-sm backdrop-blur-sm transition-all hover:bg-rose-500 hover:text-white z-20"
                                    title="Remove photo"
                                >
                                    <XMarkIcon className="h-3.5 w-3.5" />
                                </button>
                                
                                <div className="absolute bottom-2 left-2 z-10">
                                    <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md
                                        ${isActive ? 'bg-cyan-600 text-white' : 'bg-white/90 text-slate-700'}
                                    `}>
                                        {isActive ? '★ Candidate' : 'New Upload'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 
                    ${disabled ? 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-60' : isDragging ? 'border-cyan-500 bg-cyan-50 animate-pulse' : 'border-slate-200 bg-white hover:border-cyan-400 hover:bg-slate-50 hover:shadow-sm'}
                    ${!multiple && (previews.length > 0 || displayUrls.length > 0) ? 'aspect-square max-w-[240px]' : (multiple && (existingFiles.length > 0 || previews.length > 0)) ? 'py-4 px-6' : 'p-10'}
                `}
                onClick={() => !disabled && fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple={multiple}
                    className="hidden"
                    onChange={handleFileChange}
                />

                {/* Content Layout */}
                <div className="flex h-full w-full flex-col items-center justify-center text-center">
                    {!multiple ? (
                        /* Single Mode Preview */
                        previews.length > 0 || displayUrls.length > 0 ? (
                            <div className="relative h-full w-full overflow-hidden rounded-lg group shadow-inner">
                                <img
                                    src={previews[0] || displayUrls[0]}
                                    alt="Preview"
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                    <p className="text-xs font-bold text-white uppercase tracking-wider">Change Image</p>
                                </div>
                                <button
                                    onClick={(e) => removeFile(0, e)}
                                    className="absolute right-2 top-2 rounded-full bg-rose-500 p-1 text-white shadow-lg hover:bg-rose-600 transition-transform hover:scale-110 z-10"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                                {previews.length > 0 && (
                                    <span className="absolute bottom-2 left-2 rounded-md bg-cyan-600 px-2 py-1 text-[10px] font-bold text-white uppercase shadow-lg">New Selection</span>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="mb-3 rounded-2xl bg-slate-50 p-4 text-slate-400 transition-colors group-hover:bg-cyan-50 group-hover:text-cyan-600">
                                    <CloudArrowUpIcon className="h-8 w-8" />
                                </div>
                                <p className="text-sm font-semibold text-slate-700">{label}</p>
                                <p className="mt-1 text-xs text-slate-400">PNG, JPG or WebP up to 10MB</p>
                            </>
                        )
                    ) : (
                        /* Multiple Mode - Compact trigger when gallery is visible */
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-slate-50 p-3 text-slate-400 shadow-inner">
                                <CloudArrowUpIcon className="h-6 w-6" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-semibold text-slate-700">{label}</p>
                                <p className="text-xs text-slate-500">Pick as many photos as you need</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
