import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, EyeIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { RichTextEditor } from '../components/RichTextEditor';
import { CategoryMultiSelect } from '../components/CategoryMultiSelect';
import { ArticlePreviewPanel } from '../components/ArticlePreviewPanel';
import { articleService } from '../services/articleService';
import { articleCategoryService } from '../services/articleCategoryService';
import { usePermissionCheck } from '../../../hooks/usePermissionCheck';
import { toApiError } from '../../../api/httpClient';
import { Modal } from '../../../components/Modal';
import { removeImages, hasImages, countHtmlLines } from '../utils/htmlUtils';
import { processContentImages } from '../utils/imageHandler';
import { useArticleStore } from '../hooks/useArticleStore';
import type { ArticleCategory, ArticleStatus } from '../types/article.types';

export function ArticleFormPage() {
    const { id } = useParams<{ id?: string }>();
    const isEditing = Boolean(id);
    const navigate = useNavigate();
    const { ensure } = usePermissionCheck();

    // Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState<ArticleStatus>('Active');
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

    // Meta state
    const [categories, setCategories] = useState<ArticleCategory[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditing);
    const [showPreview, setShowPreview] = useState(false);

    // Load categories
    useEffect(() => {
        void articleCategoryService.getAll().then(setCategories).catch(() => {
            toast.error('Failed to load categories');
        });
    }, []);

    // Load existing article for edit
    const loadArticle = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const article = await articleService.getById(Number(id));
            setTitle(article.title);
            setContent(article.content);
            setStatus(article.status);
            setSelectedCategoryIds(article.categories.map((c) => c.id));
            if (article.thumbnailUrl) {
                setThumbnailPreview(article.thumbnailUrl);
            }
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load article');
            navigate('/admin/articles');
        } finally {
            setIsLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        void loadArticle();
    }, [loadArticle]);

    const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingThumbnail(true);
        try {
            const url = await articleService.uploadImage(file);
            setThumbnailPreview(url);
            // We still keep thumbnailFile for compatibility if needed, but the URL is what matters now
            setThumbnailFile(file);
            toast.success('Thumbnail uploaded to cloud');
        } catch (error) {
            toast.error('Failed to upload thumbnail');
        } finally {
            setIsUploadingThumbnail(false);
        }
    };

    const handleSave = async () => {
        const permission = 'MANAGE_ARTICLES';
        const action = isEditing ? 'update article' : 'create article';
        if (!ensure(permission, action)) return;
        const cleanTitle = removeImages(title).trim();

        if (!cleanTitle) {
            toast.error('Title is required');
            return;
        }
        if (cleanTitle.length > 200) {
            toast.error('Title cannot exceed 200 characters');
            return;
        }
        if (countHtmlLines(title) > 3) {
            toast.error('Title cannot exceed 3 lines');
            return;
        }
        if (hasImages(title)) {
            toast.error('Images are not allowed in the title');
            return;
        }
        if (!content.trim() || content === '<p></p>') {
            toast.error('Content is required');
            return;
        }

        setIsSaving(true);
        try {
            // Requirement: Automatically upload all images in content to cloud
            const processedContent = await processContentImages(content);

            const payload = {
                title: cleanTitle,
                content: processedContent,
                status,
                categoryIds: selectedCategoryIds,
                // Only send the file if it hasn't been uploaded to cloud yet (e.g. if it's still a local blob/base64)
                thumbnail: (thumbnailPreview && !thumbnailPreview.startsWith('http')) ? thumbnailFile ?? undefined : undefined,
                thumbnailUrl: thumbnailPreview ?? '',
            };

            if (isEditing) {
                await articleService.update(Number(id), payload);
                toast.success('Article updated successfully');
            } else {
                await articleService.create(payload);
                toast.success('Article created successfully');
            }

            useArticleStore.setState({ isLoaded: false });
            navigate('/admin/articles');
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to save article');
        } finally {
            setIsSaving(false);
        }
    };

    const previewData = {
        title,
        content,
        status,
        thumbnailUrl: thumbnailPreview ?? undefined,
        categories: categories.filter((c) => selectedCategoryIds.includes(c.id)),
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/articles')}
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                            {isEditing ? 'Edit Article' : 'New Article'}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {isEditing ? 'Update the article content and settings.' : 'Fill in the details to create a new article.'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowPreview(true)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        <EyeIcon className="h-4 w-4" />
                        Preview
                    </button>
                    <button
                        type="button"
                        onClick={() => void handleSave()}
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
                    >
                        {isSaving ? 'Saving...' : isEditing ? 'Update Article' : 'Publish Article'}
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left – main form */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Title */}
                    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
                        <div>
                            <label htmlFor="article-title" className="block text-sm font-semibold text-slate-900">
                                Title
                            </label>
                            <p className="text-xs text-slate-500">The main heading of the article.</p>
                        </div>
                        <RichTextEditor
                            value={title}
                            onChange={setTitle}
                            placeholder="Enter article title..."
                            minHeight={100}
                            allowImages={false}
                            variant="basic"
                        />
                    </section>

                    {/* Content */}
                    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-900">Content</label>
                            <p className="text-xs text-slate-500">The full body of the article. Supports rich formatting.</p>
                        </div>
                        <RichTextEditor
                            value={content}
                            onChange={setContent}
                            placeholder="Write your article content here..."
                            minHeight={300}
                        />
                    </section>
                </div>

                {/* Right – sidebar settings */}
                <div className="space-y-4">
                    {/* Status */}
                    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
                        <h3 className="text-sm font-semibold text-slate-900">Status</h3>
                        <div className="flex gap-3">
                            {(['Active', 'Inactive'] as ArticleStatus[]).map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setStatus(s)}
                                    className={`flex-1 rounded-lg border py-2 text-sm font-medium transition ${status === s
                                        ? s === 'Active'
                                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                            : 'border-slate-300 bg-slate-100 text-slate-700'
                                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Categories */}
                    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Categories</h3>
                            <p className="text-xs text-slate-500">Assign one or more categories.</p>
                        </div>
                        <CategoryMultiSelect
                            categories={categories.filter(c => c.isActive || selectedCategoryIds.includes(c.id))}
                            selected={selectedCategoryIds}
                            onChange={setSelectedCategoryIds}
                        />
                    </section>

                    {/* Thumbnail */}
                    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Thumbnail</h3>
                            <p className="text-xs text-slate-500">Cover image displayed on the article page.</p>
                        </div>

                        {thumbnailPreview ? (
                            <div className="relative overflow-hidden rounded-xl border border-slate-200">
                                <img
                                    src={thumbnailPreview}
                                    alt="Thumbnail preview"
                                    className="w-full object-cover"
                                    style={{ maxHeight: 180 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setThumbnailFile(null);
                                        setThumbnailPreview(null);
                                    }}
                                    className="absolute right-2 top-2 rounded-lg bg-white/80 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-white"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <label
                                htmlFor="thumbnail-upload"
                                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-8 transition hover:border-cyan-300 hover:bg-cyan-50/30 ${isUploadingThumbnail ? 'opacity-60 cursor-wait' : ''}`}
                            >
                                <PhotoIcon className={`h-8 w-8 ${isUploadingThumbnail ? 'animate-pulse text-cyan-600' : 'text-slate-400'}`} />
                                <span className="text-xs text-slate-500">
                                    {isUploadingThumbnail ? 'Uploading...' : 'Click to upload a thumbnail'}
                                </span>
                                <input
                                    id="thumbnail-upload"
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={(e) => void handleThumbnailChange(e)}
                                    disabled={isUploadingThumbnail}
                                />
                            </label>
                        )}
                    </section>
                </div>
            </div>

            {/* Preview Modal */}
            <Modal open={showPreview} title="Article Preview" onClose={() => setShowPreview(false)}>
                <ArticlePreviewPanel article={previewData} />
            </Modal>
        </div>
    );
}
