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



let activeRequests = 0;

function updateLoadingBar(show) {
    window.dispatchEvent(new CustomEvent("api-loading", { detail: show }));
}

const API = axios.create({
    baseURL: baseURL,
});

API.interceptors.request.use((req) => {
    activeRequests++;
    if (activeRequests === 1) {
        updateLoadingBar(true);
    }
    const token = localStorage.getItem("token");
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

API.interceptors.response.use(
    (response) => {
        activeRequests--;
        if (activeRequests <= 0) {
            activeRequests = 0;
            updateLoadingBar(false);
        }
        return response;
    },
    async (err) => {
        activeRequests--;
        if (activeRequests <= 0) {
            activeRequests = 0;
            updateLoadingBar(false);
        }
        const { config, response } = err;

        if (response && response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            if (!window.location.pathname.includes("/login")) {
                window.location.href = "/login";
            }
            return Promise.reject(err);
        }

        if (!config) return Promise.reject(err);
        if (config.retry === undefined) config.retry = 0;

        const shouldRetry = !response || (response.status >= 500 && response.status <= 599);

        if (shouldRetry && config.retry < 2) {
            config.retry++;
            const delay = config.retry * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            return API(config);
        }
        return Promise.reject(err);
    }
);

export default API;
