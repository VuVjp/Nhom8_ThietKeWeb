import type { PaginatedResponse, ServerPaginatedResponse } from '../types/api';

interface NormalizePaginationOptions<TIn, TOut> {
    page: number;
    pageSize: number;
    search?: string;
    mapper?: (item: TIn) => TOut;
    filterPredicate?: (item: TOut) => boolean;
    searchPredicate?: (item: TOut, keyword: string) => boolean;
}

const isServerPaginated = <T,>(value: unknown): value is ServerPaginatedResponse<T> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }

    const candidate = value as ServerPaginatedResponse<T>;
    return Array.isArray(candidate.items) || Array.isArray(candidate.data);
};

export const normalizePaginatedResponse = <TIn, TOut = TIn>(
    raw: unknown,
    options: NormalizePaginationOptions<TIn, TOut>,
): PaginatedResponse<TOut> => {
    const { page, pageSize, search, mapper, filterPredicate, searchPredicate } = options;
    const mapItem = (item: TIn) => (mapper ? mapper(item) : (item as unknown as TOut));

    const source = isServerPaginated<TIn>(raw)
        ? (raw.items ?? raw.data ?? [])
        : Array.isArray(raw)
            ? (raw as TIn[])
            : [];

    const mapped = source.map(mapItem);
    const preFiltered = filterPredicate ? mapped.filter(filterPredicate) : mapped;

    const keyword = search?.trim().toLowerCase();
    const filtered = keyword
        ? preFiltered.filter((item) => {
            if (searchPredicate) {
                return searchPredicate(item, keyword);
            }

            return JSON.stringify(item).toLowerCase().includes(keyword);
        })
        : preFiltered;

    const totalFromServer = isServerPaginated<TIn>(raw)
        ? (raw.total ?? raw.totalCount)
        : undefined;

    const effectiveTotal = typeof totalFromServer === 'number' ? totalFromServer : filtered.length;

    if (isServerPaginated<TIn>(raw) && typeof totalFromServer === 'number') {
        return {
            items: filtered,
            total: effectiveTotal,
            page: raw.page ?? raw.pageIndex ?? page,
            pageSize: raw.pageSize ?? pageSize,
        };
    }

    const start = Math.max(page - 1, 0) * pageSize;
    const end = start + pageSize;

    return {
        items: filtered.slice(start, end),
        total: filtered.length,
        page,
        pageSize,
    };
};
