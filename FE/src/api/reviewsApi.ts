import { httpClient } from './httpClient';

export interface ReviewItem {
    id: number;
    userId?: number;
    userName?: string;
    userAvatarUrl?: string;
    roomTypeId?: number;
    roomTypeName?: string;
    rating: number;
    comment?: string;
    createdAt?: string;
    isActive: boolean;
}

export interface ReviewQueryPayload {
    search?: string;
    roomTypeId?: number;
    rating?: number;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
}

export interface PaginatedReviews {
    items: ReviewItem[];
    total: number;
    page: number;
    pageSize: number;
}

interface ReviewDto {
    isActive?: boolean;
    IsActive?: boolean;
    id?: number;
    Id?: number;
    userId?: number;
    UserId?: number;
    userName?: string;
    UserName?: string;
    userAvatarUrl?: string;
    UserAvatarUrl?: string;
    roomTypeId?: number;
    RoomTypeId?: number;
    roomTypeName?: string;
    RoomTypeName?: string;
    rating?: number;
    Rating?: number;
    comment?: string;
    Comment?: string;
    createdAt?: string;
    CreatedAt?: string;
}

function normalizeReview(dto: ReviewDto): ReviewItem {
    return {
        id: Number(dto.id ?? dto.Id ?? 0),
        userId: dto.userId ?? dto.UserId,
        userName: dto.userName ?? dto.UserName,
        userAvatarUrl: dto.userAvatarUrl ?? dto.UserAvatarUrl,
        roomTypeId: dto.roomTypeId ?? dto.RoomTypeId,
        roomTypeName: dto.roomTypeName ?? dto.RoomTypeName,
        rating: Number(dto.rating ?? dto.Rating ?? 0),
        comment: dto.comment ?? dto.Comment,
        createdAt: dto.createdAt ?? dto.CreatedAt,
        isActive: Boolean(dto.isActive ?? dto.IsActive ?? false),
    };
}

export const reviewsApi = {
    async getAll() {
        const { data } = await httpClient.get<ReviewDto[]>('reviews');
        return data.map(normalizeReview);
    },

    async getPaged(query: ReviewQueryPayload) {
        const { data } = await httpClient.get<{ items: ReviewDto[]; total: number; page: number; pageSize: number }>('reviews', {
            params: query,
        });
        return {
            items: data.items.map(normalizeReview),
            total: data.total,
            page: data.page,
            pageSize: data.pageSize,
        };
    },

    async remove(id: number) {
        await httpClient.delete(`reviews/${id}`);
    },

    async toggleActive(id: number) {
        await httpClient.patch(`reviews/${id}/toggle-active`);
    },
};
