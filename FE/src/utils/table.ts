import type { SortDirection } from '../types/table';

export const paginate = <T,>(rows: T[], page: number, pageSize: number) => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
};

export const sortBy = <T,>(rows: T[], selector: (row: T) => string | number, direction: SortDirection) => {
    const sorted = [...rows].sort((a, b) => {
        const x = selector(a);
        const y = selector(b);

        if (typeof x === 'number' && typeof y === 'number') {
            return x - y;
        }

        return String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: 'base' });
    });

    return direction === 'asc' ? sorted : sorted.reverse();
};

export const queryIncludes = (value: string, query: string) => value.toLowerCase().includes(query.toLowerCase());
