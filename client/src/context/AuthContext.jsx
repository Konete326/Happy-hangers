import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (savedUser && token) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);

            // Initial Branding setup
            if (parsedUser.brandName) document.title = `${parsedUser.brandName} - Smart POS`;
            if (parsedUser.brandLogo) {
                const favicon = document.getElementById("favicon");
                if (favicon) favicon.href = parsedUser.brandLogo;
            }
        }
        setLoading(false);
    }, []);

    // Watch for live user changes to update branding instantly
    useEffect(() => {
        if (user) {
            document.title = `${user.brandName || "Happy Hanger"} - Smart POS`;
            const favicon = document.getElementById("favicon");
            if (favicon && user.brandLogo) {
                favicon.href = user.brandLogo;
            }
        }
    }, [user]);

    const login = (userData, token) => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", token);
    };

    const updateUser = (userData) => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, updateUser, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
