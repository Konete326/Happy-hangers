import axios from "axios";

let baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Robust check: Ensure URL has protocol
if (!baseURL.startsWith('http')) {
    baseURL = `https://${baseURL}`;
}

// Ensure URL ends with /api
if (!baseURL.endsWith('/api')) {
    // Remove trailing slash if any
    baseURL = baseURL.replace(/\/$/, "");
    baseURL = `${baseURL}/api`;
}

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

export default API;
