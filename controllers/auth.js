import fetch from 'isomorphic-fetch';
import cookie from 'js-cookie';
import { API } from '../config';
import Router from 'next/router';

// ========================
// HANDLE SESSION EXPIRATION
// ========================
export const handleResponse = response => {
    if (response.status === 401) {
        signout(() => {
            Router.push({
                pathname: '/signin',
                query: { message: 'Your session has expired. Please sign in again.' }
            });
        });
    }
};

// ========================
// SIGNUP
// ========================
export const signup = async (user) => {
    try {
        // Validate email
        if (!user?.email || !/\S+@\S+\.\S+/.test(user.email)) {
            throw new Error("Invalid or missing email address");
        }

        const response = await fetch(`${API}/signup`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user)
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = { error: text };
        }

        if (!response.ok) {
            throw new Error(data.error || data.message || "Signup failed");
        }

        return data;

    } catch (err) {
        console.error("Signup error:", err);
        return { error: err.message };
    }
};

// ========================
// SIGNIN
// ========================
export const signin = async (user) => {
    try {
        // Validate inputs
        if (!user?.email || !user?.password) {
            throw new Error("Email and password are required");
        }

        console.log("Signin request payload:", user);

        const response = await fetch(`${API}/signin`, {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });

        const text = await response.text(); // get raw response
        console.log("Signin raw response:", text);

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = { error: text };
        }

        if (!response.ok) {
            throw new Error(data.error || data.message || `Signin failed with status ${response.status}`);
        }

        return data;

    } catch (err) {
        console.error("Signin error:", err);
        return { error: err.message };
    }
};

// ========================
// SIGNOUT
// ========================
export const signout = async (next) => {
    removeCookie('token');
    removeLocalStorage('user');

    try {
        const response = await fetch(`${API}/signout`, { method: 'GET' });
        console.log('Signout success');
    } catch (err) {
        console.error('Signout error:', err);
    }

    if (next) next();
};

// ========================
// COOKIE & LOCALSTORAGE HELPERS
// ========================
export const setCookie = (key, value) => {
    if (typeof window !== 'undefined') {
        cookie.set(key, value, { expires: 1 });
    }
};

export const removeCookie = key => {
    if (typeof window !== 'undefined') {
        cookie.remove(key, { expires: 1 });
    }
};

export const getCookie = key => {
    if (typeof window !== 'undefined') return cookie.get(key);
};

export const setLocalStorage = (key, value) => {
    if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(value));
};

export const removeLocalStorage = key => {
    if (typeof window !== 'undefined') localStorage.removeItem(key);
};

// ========================
// AUTHENTICATION
// ========================
export const authenticate = (data, next) => {
    setCookie('token', data.token);
    setLocalStorage('user', data.user);
    next();
};

export const googleauthenticate = (data) => {
    setCookie('token', data.token);
    setLocalStorage('user', data.user);
};

export const isAuth = () => {
    if (typeof window !== 'undefined') {
        const token = getCookie('token');
        if (token) {
            const user = localStorage.getItem('user');
            if (user) return JSON.parse(user);
        }
    }
    return false;
};

export const updateUser = (user, next) => {
    if (typeof window !== 'undefined' && localStorage.getItem('user')) {
        localStorage.setItem('user', JSON.stringify(user));
        next();
    }
};

// ========================
// PASSWORD MANAGEMENT
// ========================
export const forgotPassword = async (email) => {
    try {
        const response = await fetch(`${API}/forgot-password`, {
            method: 'PUT',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify(email)
        });

        const data = await response.json();
        return data;
    } catch (err) {
        console.error("Forgot password error:", err);
        return { error: "Something went wrong. Please try again later." };
    }
};

export const resetPassword = async (resetInfo) => {
    try {
        const response = await fetch(`${API}/reset-password`, {
            method: 'PUT',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify(resetInfo)
        });

        const data = await response.json();
        return data;
    } catch (err) {
        console.error("Reset password error:", err);
        return { error: "Something went wrong. Please try again later." };
    }
};
