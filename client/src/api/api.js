import axios from "axios";

let baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Robust check: Ensure URL has protocol
if (!baseURL.startsWith('http')) {
    const isLocal = baseURL.includes('localhost') || baseURL.includes('127.0.0.1');
    baseURL = `${isLocal ? 'http' : 'https'}://${baseURL}`;
}

// Ensure URL ends with /api
if (!baseURL.endsWith('/api')) {
    baseURL = baseURL.replace(/\/$/, "");
    baseURL = `${baseURL}/api`;
}

console.log(" API Base URL:", baseURL);

const API = axios.create({
    baseURL: baseURL,
});

// Automatically attach token to every request if it exists
API.interceptors.request.use((req) => {
    const token = localStorage.getItem("token");
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

// Interceptor for handling intermittent failures with a simple retry
API.interceptors.response.use(undefined, async (err) => {
    const { config, response } = err;
    if (!config || !config.retry) {
        config.retry = 0;
    }

    // Only retry on network errors or 5xx server errors, not client errors (4xx)
    const shouldRetry = !response || (response.status >= 500 && response.status <= 599);

    if (shouldRetry && config.retry < 2) {
        config.retry++;
        // Geometric backoff could be added but let's keep it simple as per user request
        const delay = config.retry * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return API(config);
    }
    return Promise.reject(err);
});

export default API;
