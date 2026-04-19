import type { ArticleItem } from '../types/article.types';

interface ArticlePreviewPanelProps {
    article: Partial<ArticleItem> & { title: string; content: string };
}

export function ArticlePreviewPanel({ article }: ArticlePreviewPanelProps) {
    const formattedDate = article.createdAt
        ? new Date(article.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="mx-auto max-w-3xl">
            {/* Article header */}
            <div className="mb-8">
                {article.categories && article.categories.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                        {article.categories.map((cat) => (
                            <span
                                key={cat.id}
                                className="rounded-full bg-cyan-50 border border-cyan-200 px-3 py-1 text-xs font-semibold text-cyan-700"
                            >
                                {cat.name}
                            </span>
                        ))}
                    </div>
                )}

                <h1
                    className="mb-4 text-3xl font-bold leading-tight text-slate-900"
                    dangerouslySetInnerHTML={{ __html: article.title || '<em>Untitled Article</em>' }}
                />

                <div className="flex items-center gap-3 text-sm text-slate-500">
                    {article.authorName && (
                        <>
                            <span className="font-medium text-slate-700">{article.authorName}</span>
                            <span>·</span>
                        </>
                    )}
                    <span>{formattedDate}</span>
                    {article.status && (
                        <>
                            <span>·</span>
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                    article.status === 'Active'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                                {article.status}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Thumbnail */}
            {article.thumbnailUrl && (
                <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200">
                    <img
                        src={article.thumbnailUrl}
                        alt="Article thumbnail"
                        className="w-full object-cover"
                        style={{ maxHeight: 400 }}
                    />
                </div>
            )}

            {/* Content */}
            <div
                className="prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: article.content || '<p><em>No content yet.</em></p>' }}
            />
        </div>
    );
}
