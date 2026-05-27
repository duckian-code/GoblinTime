export function buildUrl(base, endpoint) {
    const cleanBase = (base || '').replace(/\/+$/, '');
    const cleanEndpoint = (endpoint || '').replace(/^\/+/, '').replace(/\/+$/, '');
    return `${cleanBase}/${cleanEndpoint}`;
}