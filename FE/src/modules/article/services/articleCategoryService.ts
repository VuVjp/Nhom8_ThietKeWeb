import { httpClient } from '../../../api/httpClient';
import type {
    ArticleCategory,
    CreateArticleCategoryPayload,
    UpdateArticleCategoryPayload,
} from '../types/article.types';

interface CategoryDto {
    id?: number;
    Id?: number;
    name?: string;
    Name?: string;
    isActive?: boolean;
    IsActive?: boolean;
}

function normalizeCategory(dto: CategoryDto): ArticleCategory {
    return {
        id: Number(dto.id ?? dto.Id ?? 0),
        name: String(dto.name ?? dto.Name ?? ''),
        isActive: Boolean(dto.isActive ?? dto.IsActive ?? true),
    };
}

export const articleCategoryService = {
    async getAll(): Promise<ArticleCategory[]> {
        const { data } = await httpClient.get<CategoryDto[]>('articlecategories');
        return data.map(normalizeCategory);
    },

    async getById(id: number): Promise<ArticleCategory> {
        const { data } = await httpClient.get<CategoryDto>(`articlecategories/${id}`);
        return normalizeCategory(data);
    },

    async create(payload: CreateArticleCategoryPayload): Promise<ArticleCategory> {
        const { data } = await httpClient.post<CategoryDto>('articlecategories', {
            name: payload.name,
        });
        return normalizeCategory(data);
    },

    async update(id: number, payload: UpdateArticleCategoryPayload): Promise<ArticleCategory> {
        const { data } = await httpClient.put<CategoryDto>(`articlecategories/${id}`, {
            name: payload.name,
        });
        return normalizeCategory(data);
    },

    async remove(id: number): Promise<void> {
        await httpClient.delete(`articlecategories/${id}`);
    },

    async restore(id: number): Promise<void> {
        await httpClient.put(`articlecategories/${id}/restore`);
    },
};
