const DEFAULT_API_BASE_URL = 'http://localhost:5082/api';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
const apiRootUrl = apiBaseUrl.replace(/\/api\/?$/, '');

export const env = {
    apiBaseUrl,
    apiRootUrl,
};
