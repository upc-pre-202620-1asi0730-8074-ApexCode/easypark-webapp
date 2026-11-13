import axios from 'axios';
import {iamInterceptor} from '../../iam/infrastructure/iam.interceptor.js';

const platformApi = import.meta.env.VITE_EASYPARK_API_URL;
if (!/^https:\/\/[^/]+\/api\/v1\/?$/.test(platformApi ?? '')) {
    throw new Error('EasyPark requiere VITE_EASYPARK_API_URL HTTPS apuntando a /api/v1.');
}
const allowedOrigin = new URL(platformApi).origin;

export class BaseApi {
    #http;

    constructor() {
        this.#http = axios.create({
            baseURL: platformApi.replace(/\/$/, ''),
            timeout: 30000,
            headers: {'Content-Type': 'application/json'}
        });
        this.#http.interceptors.request.use((request) => {
            // Impide destinos ajenos a la API (incluidos mocks y URLs externas).
            const endpoint = String(request.url ?? '');
            if (endpoint.startsWith('//')) {
                return Promise.reject(new Error('URL de red externa bloqueada.'));
            }
            const target = /^https?:\/\//i.test(endpoint)
                ? new URL(endpoint)
                : new URL(`${request.baseURL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`);
            if (target.origin !== allowedOrigin || !target.pathname.startsWith('/api/v1/')) {
                return Promise.reject(new Error('Solicitud bloqueada fuera de EasyPark API.'));
            }
            return iamInterceptor(request);
        });
    }

    get http() { return this.#http; }
}
