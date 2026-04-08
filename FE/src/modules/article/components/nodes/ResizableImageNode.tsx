import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useState, useRef } from 'react';
import { AlignLeftIcon, AlignCenterIcon, AlignRightIcon } from 'lucide-react';

export default function ResizableImageNode(props: NodeViewProps) {
    const { node, updateAttributes, selected } = props;
    const { src, alt, width, align } = node.attrs;

    const [isResizing, setIsResizing] = useState(false);
    const imageRef = useRef<HTMLImageElement>(null);

    const onMouseDownRight = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        const startX = e.clientX;
        const startWidth = imageRef.current?.getBoundingClientRect().width || 0;
        
        const onMouseMove = (moveEvent: MouseEvent) => {
            const currentX = moveEvent.clientX;
            const diff = currentX - startX;
            // Constrain minimum width, let browser calculate responsive auto height organically
            updateAttributes({ width: `${Math.max(100, startWidth + diff)}px` });
        };
        const onMouseUp = () => {
            setIsResizing(false);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
        
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    return (
        <NodeViewWrapper 
            className="my-5 flex w-full relative group"
            style={{ justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' }}
        >
            <div 
                className={`relative inline-block m-0 leading-none ${selected ? 'ring-2 ring-cyan-500 rounded offset-2' : ''}`} 
                style={{ width: width, maxWidth: '100%' }}
            >
                <img 
                    ref={imageRef} 
                    src={src} 
                    alt={alt} 
                    className="w-full h-auto block m-0 rounded" 
                    style={{ pointerEvents: isResizing ? 'none' : 'auto' }}
                />
                
                {/* Resize Handle - Right side */}
                {selected && (
                    <div 
                        onMouseDown={onMouseDownRight}
                        className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-20 flex items-center justify-center group-hover:bg-cyan-500 group-hover:bg-opacity-20 transition"
                        style={{ transform: 'translateX(50%)' }}
                    >
                        <div className="w-1 h-8 bg-cyan-700 rounded-full opacity-0 group-hover:opacity-100" />
                    </div>
                )}

                {/* Alignment Mini-Toolbar */}
                {selected && (
                    <div 
                        className="absolute top-2 left-2 bg-white rounded-md shadow-md p-1 border border-slate-200 flex items-center gap-1 z-30"
                        onMouseDown={e => e.stopPropagation()} // Prevent deselecting image when clicking tools
                    >
                        <button 
                            type="button" 
                            onClick={() => updateAttributes({ align: 'left' })} 
                            className={`p-1 rounded ${align === 'left' ? 'text-cyan-700 bg-cyan-50' : 'text-slate-500 hover:bg-slate-50'}`}
                            title="Align Left"
                        >
                            <AlignLeftIcon className="w-4 h-4" />
                        </button>
                        <button 
                            type="button" 
                            onClick={() => updateAttributes({ align: 'center' })} 
                            className={`p-1 rounded ${align === 'center' ? 'text-cyan-700 bg-cyan-50' : 'text-slate-500 hover:bg-slate-50'}`}
                            title="Align Center"
                        >
                            <AlignCenterIcon className="w-4 h-4" />
                        </button>
                        <button 
                            type="button" 
                            onClick={() => updateAttributes({ align: 'right' })} 
                            className={`p-1 rounded ${align === 'right' ? 'text-cyan-700 bg-cyan-50' : 'text-slate-500 hover:bg-slate-50'}`}
                            title="Align Right"
                        >
                            <AlignRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </NodeViewWrapper>
    );
}
