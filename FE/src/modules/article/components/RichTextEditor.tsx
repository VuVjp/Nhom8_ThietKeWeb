import { useEditor, EditorContent } from '@tiptap/react';
import { useRef, useState } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import {
    BoldIcon,
    ItalicIcon,
    UnderlineIcon,
    StrikethroughIcon,
    ListIcon,
    ListOrderedIcon,
    AlignLeftIcon,
    AlignCenterIcon,
    AlignRightIcon,
    ImageIcon,
    Heading1Icon,
    Heading2Icon,
    Heading3Icon,
    QuoteIcon,
    CodeIcon,
    LinkIcon,
    UnlinkIcon,
    HighlighterIcon,
    UndoIcon,
    RedoIcon,
    MinusIcon
} from 'lucide-react';

import { articleService } from '../services/articleService';
import toast from 'react-hot-toast';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: number;
    allowImages?: boolean;
    variant?: 'basic' | 'detailed';
}

export function RichTextEditor({ 
    value, 
    onChange, 
    placeholder = 'Start typing...', 
    minHeight = 200, 
    allowImages = true,
    variant = 'detailed'
}: RichTextEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Image.configure({ inline: false }),
            Placeholder.configure({ placeholder }),
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            Link.configure({
                openOnClick: false,
                autolink: true,
                defaultProtocol: 'https',
            })
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;

        setIsUploading(true);
        try {
            const url = await articleService.uploadImage(file);
            editor.chain().focus().setImage({ src: url }).run();
        } catch (error) {
            toast.error('Failed to upload image');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const triggerImageUpload = () => {
        fileInputRef.current?.click();
    };

    const setLink = () => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL:', previousUrl);
        
        if (url === null) {
            return;
        }

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    if (!editor) return null;

    const toolbarBtn = (active: boolean, onClick: () => void, title: string, children: React.ReactNode, disabled: boolean = false) => (
        <button
            type="button"
            title={title}
            onClick={onClick}
            disabled={disabled}
            className={`rounded-lg p-1.5 transition ${
                disabled ? 'opacity-50 cursor-not-allowed text-slate-400' 
                : active ? 'bg-cyan-100 text-cyan-700' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
        >
            {children}
        </button>
    );

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col">
            {variant === 'basic' ? (
                <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
                    {toolbarBtn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'Bold', <BoldIcon className="h-4 w-4" />)}
                    {toolbarBtn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'Italic', <ItalicIcon className="h-4 w-4" />)}
                    {toolbarBtn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'Underline', <UnderlineIcon className="h-4 w-4" />)}

                    <div className="mx-1 h-5 w-px bg-slate-200" />

                    {toolbarBtn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), 'Bullet List', <ListIcon className="h-4 w-4" />)}
                    {toolbarBtn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Ordered List', <ListOrderedIcon className="h-4 w-4" />)}

                    {allowImages && (
                        <>
                            <div className="mx-1 h-5 w-px bg-slate-200" />
                            {toolbarBtn(false, triggerImageUpload, 'Upload Image', <ImageIcon className={`h-4 w-4 ${isUploading ? 'animate-pulse text-cyan-600' : ''}`} />)}
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={isUploading}
                            />
                        </>
                    )}
                </div>
            ) : (
                <>
                    {/* Toolbar Top */}
                    <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50 px-2 pt-2 pb-1">
                        {toolbarBtn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'Bold', <BoldIcon className="h-4 w-4" />)}
                        {toolbarBtn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'Italic', <ItalicIcon className="h-4 w-4" />)}
                        {toolbarBtn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'Underline', <UnderlineIcon className="h-4 w-4" />)}
                        {toolbarBtn(editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), 'Strikethrough', <StrikethroughIcon className="h-4 w-4" />)}
                        {toolbarBtn(editor.isActive('highlight'), () => editor.chain().focus().toggleHighlight().run(), 'Highlight', <HighlighterIcon className="h-4 w-4" />)}

                        <div className="mx-1 h-5 w-px bg-slate-200" />

                        <input
                            type="color"
                            onInput={event => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
                            value={editor.getAttributes('textStyle').color || '#000000'}
                            data-testid="setColor"
                            className="h-6 w-6 cursor-pointer border-0 p-0 rounded overflow-hidden shadow-sm flex-shrink-0"
                            title="Text Color"
                        />

                        <div className="mx-1 h-5 w-px bg-slate-200" />

                        {toolbarBtn(editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), 'Heading 1', <Heading1Icon className="h-4 w-4" />)}
                        {toolbarBtn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'Heading 2', <Heading2Icon className="h-4 w-4" />)}
                        {toolbarBtn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'Heading 3', <Heading3Icon className="h-4 w-4" />)}

                        <div className="mx-1 h-5 w-px bg-slate-200" />

                        {toolbarBtn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), 'Bullet List', <ListIcon className="h-4 w-4" />)}
                        {toolbarBtn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Ordered List', <ListOrderedIcon className="h-4 w-4" />)}
                        
                        <div className="mx-1 h-5 w-px bg-slate-200" />
                        
                        {toolbarBtn(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), 'Blockquote', <QuoteIcon className="h-4 w-4" />)}
                        {toolbarBtn(editor.isActive('codeBlock'), () => editor.chain().focus().toggleCodeBlock().run(), 'Code Block', <CodeIcon className="h-4 w-4" />)}
                        {toolbarBtn(false, () => editor.chain().focus().setHorizontalRule().run(), 'Horizontal Rule', <MinusIcon className="h-4 w-4" />)}

                    </div>
                    {/* Toolbar Bottom */}
                    <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 pt-1 pb-2">
                        {toolbarBtn(editor.isActive({ textAlign: 'left' }), () => editor.chain().focus().setTextAlign('left').run(), 'Align Left', <AlignLeftIcon className="h-4 w-4" />)}
                        {toolbarBtn(editor.isActive({ textAlign: 'center' }), () => editor.chain().focus().setTextAlign('center').run(), 'Align Center', <AlignCenterIcon className="h-4 w-4" />)}
                        {toolbarBtn(editor.isActive({ textAlign: 'right' }), () => editor.chain().focus().setTextAlign('right').run(), 'Align Right', <AlignRightIcon className="h-4 w-4" />)}
                        
                        <div className="mx-1 h-5 w-px bg-slate-200" />
                        
                        {toolbarBtn(editor.isActive('link'), setLink, 'Set Link', <LinkIcon className="h-4 w-4" />)}
                        {toolbarBtn(false, () => editor.chain().focus().unsetLink().run(), 'Unset Link', <UnlinkIcon className="h-4 w-4" />, !editor.isActive('link'))}

                        <div className="mx-1 h-5 w-px bg-slate-200" />

                        {allowImages && (
                            <>
                                {toolbarBtn(false, triggerImageUpload, 'Upload Image', <ImageIcon className={`h-4 w-4 ${isUploading ? 'animate-pulse text-cyan-600' : ''}`} />)}
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={isUploading}
                                />
                            </>
                        )}
                        
                        <div className="flex-1" />
                        {toolbarBtn(false, () => editor.chain().focus().undo().run(), 'Undo', <UndoIcon className="h-4 w-4" />, !editor.can().undo())}
                        {toolbarBtn(false, () => editor.chain().focus().redo().run(), 'Redo', <RedoIcon className="h-4 w-4" />, !editor.can().redo())}
                    </div>
                </>
            )}

            {/* Editor area - styled context internally for Tailwind Prose */}
            <div className="flex-1 overflow-y-auto" style={{ minHeight }}>
                <EditorContent
                    editor={editor}
                    className="prose prose-sm max-w-none px-5 py-4 text-slate-800 focus-within:outline-none h-full marker:text-slate-400 prose-a:text-cyan-600 hover:prose-a:text-cyan-800"
                />
            </div>
        </div>
    );
}
