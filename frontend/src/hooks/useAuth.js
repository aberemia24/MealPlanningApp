// src/hooks/useAuth.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/**
 * Custom hook pentru gestionarea autentificării
 * Oferă funcționalități pentru login, register, logout și verificarea stării de autentificare
 * Include verificarea automată a expirării token-ului și reîmprospătarea sesiunii
 * 
 * @returns {Object} Obiect cu starea și funcțiile de autentificare
 * @property {Object|null} user - Datele utilizatorului autentificat sau null
 * @property {boolean} isLoading - Indicator pentru starea de loading
 * @property {string|null} error - Mesaj de eroare sau null
 * @property {Function} login - Funcție pentru autentificare
 * @property {Function} register - Funcție pentru înregistrare
 * @property {Function} logout - Funcție pentru deconectare
 */
const useAuth = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const tokenCheckInterval = useRef(null);

    /**
     * Verifică validitatea token-ului JWT
     * @param {string} token - Token-ul JWT de verificat
     * @returns {boolean} True dacă token-ul este valid și neexpirat
     */
    const isTokenValid = useCallback((token) => {
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expirationTime = payload.exp * 1000; // Convertim în milisecunde
            return Date.now() < expirationTime;
        } catch {
            return false;
        }
    }, []);

    /**
     * Inițializează starea de autentificare din localStorage
     */
    const initAuth = useCallback(() => {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken && storedUser && isTokenValid(storedToken)) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Eroare la parsarea datelor utilizator:', error);
                clearAuthData();
            }
        } else if (storedToken || storedUser) {
            clearAuthData();
        }
        setIsLoading(false);
    }, [isTokenValid]);

    /**
     * Șterge datele de autentificare din localStorage
     */
    const clearAuthData = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        if (tokenCheckInterval.current) {
            clearInterval(tokenCheckInterval.current);
        }
    }, []);

    /**
     * Handler pentru erori de rețea
     * @param {Error} error - Eroarea capturată
     */
    const handleNetworkError = useCallback((error) => {
        console.error('Eroare de rețea:', error);
        const errorMessage = error.response?.data?.message || 
                           'Eroare de conexiune. Verificați conexiunea la internet.';
        setError(errorMessage);
        toast.error(errorMessage);
    }, []);

    /**
     * Funcție pentru autentificare
     * @param {string} username - Numele de utilizator
     * @param {string} password - Parola utilizatorului
     */
    const login = useCallback(async (username, password) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Eroare la autentificare');
            }

            if (!data.token || !isTokenValid(data.token)) {
                throw new Error('Token invalid primit de la server');
            }

            localStorage.setItem(TOKEN_KEY, data.token);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            setUser(data.user);

            // Inițializăm verificarea periodică a token-ului
            if (tokenCheckInterval.current) {
                clearInterval(tokenCheckInterval.current);
            }
            tokenCheckInterval.current = setInterval(() => {
                const currentToken = localStorage.getItem(TOKEN_KEY);
                if (!isTokenValid(currentToken)) {
                    toast.warn('Sesiunea a expirat. Vă rugăm să vă autentificați din nou.');
                    clearAuthData();
                    navigate('/');
                }
            }, 60000); // Verifică la fiecare minut

            navigate('/dashboard');
            toast.success('Autentificare reușită!');
        } catch (error) {
            handleNetworkError(error);
        } finally {
            setIsLoading(false);
        }
    }, [navigate, isTokenValid, handleNetworkError, clearAuthData]);

    /**
     * Funcție pentru înregistrare utilizator nou
     * @param {string} username - Numele de utilizator
     * @param {string} password - Parola utilizatorului
     */
    const register = useCallback(async (username, password) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Eroare la înregistrare');
            }

            toast.success('Cont creat cu succes! Vă puteți autentifica.');
            navigate('/');
        } catch (error) {
            handleNetworkError(error);
        } finally {
            setIsLoading(false);
        }
    }, [navigate, handleNetworkError]);

    /**
     * Funcție pentru deconectare
     * Șterge datele de autentificare și redirecționează către login
     */
    const logout = useCallback(() => {
        clearAuthData();
        navigate('/');
        toast.info('V-ați deconectat cu succes');
    }, [navigate, clearAuthData]);

    // Efect pentru inițializarea stării de autentificare
    useEffect(() => {
        initAuth();
        return () => {
            if (tokenCheckInterval.current) {
                clearInterval(tokenCheckInterval.current);
            }
        };
    }, [initAuth]);

    // Efect pentru verificarea token-ului la schimbarea rutei
    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token && !isTokenValid(token)) {
            toast.warn('Sesiunea a expirat. Vă rugăm să vă autentificați din nou.');
            clearAuthData();
            navigate('/');
        }
    }, [navigate, isTokenValid, clearAuthData]);

    return {
        user,
        isLoading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user && isTokenValid(localStorage.getItem(TOKEN_KEY))
    };
};

export default useAuth;