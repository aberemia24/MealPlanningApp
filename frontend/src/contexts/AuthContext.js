// src/contexts/AuthContext.js
import React, { createContext, useContext } from 'react';
import useAuth from '../hooks/useAuth.js';

/**
 * Context pentru gestionarea stării de autentificare la nivel global
 */
const AuthContext = createContext(null);

/**
 * Provider pentru context-ul de autentificare
 * Oferă acces la starea și funcțiile de autentificare în întreaga aplicație
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componente copil
 */
export const AuthProvider = ({ children }) => {
    const auth = useAuth();

    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Hook pentru utilizarea context-ului de autentificare
 * @returns {Object} Obiect cu starea și funcțiile de autentificare
 */
export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext trebuie folosit în interiorul unui AuthProvider');
    }
    return context;
};