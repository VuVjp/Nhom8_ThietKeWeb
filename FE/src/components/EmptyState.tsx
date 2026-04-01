interface EmptyStateProps {
    title: string;
    description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
    return (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
    );
}
