// src/pages/RegisterPage.js
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext.js";
const RegisterPage = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Parolele nu corespund!");
            return;
        }

        try {
            // Modificăm aici URL-ul - aceasta este modificarea cheie
            await axios.post("http://localhost:5000/api/auth/register", {
                username,
                password,
            });
            
            // După înregistrare cu succes, redirectăm către pagina de login
            navigate("/");
        } catch (error) {
            console.error("Eroare completă:", error);
            setError(
                error.response?.data?.message || 
                "Eroare la înregistrare! Verificați conexiunea și încercați din nou."
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
                    Creează cont nou
                </h1>

                <form onSubmit={handleRegister} className="space-y-6">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Nume de utilizator
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Parolă
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Confirmă parola
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
                    >
                        Înregistrare
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        Ai deja cont?{" "}
                        <button
                            onClick={() => navigate("/")}
                            className="text-blue-500 hover:text-blue-600 font-medium"
                        >
                            Conectează-te
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;