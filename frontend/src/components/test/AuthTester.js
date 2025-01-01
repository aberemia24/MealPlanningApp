// src/components/test/AuthTester.js
import React, { useState } from 'react';

const AuthTester = () => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const testRegister = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'Test123!',
          role: 'user',
          preferences: {
            menuType: 'vegetarian',
            numberOfPeople: 2
          }
        }),
      });
      
      const data = await response.json();
      console.log('Register response:', data); // Pentru debugging
      setStatus(`Register Status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'Test123!'
        }),
      });
      
      const data = await response.json();
      console.log('Login response:', data); // Pentru debugging
      if (response.ok) {
        localStorage.setItem('token', data.token); // Salvăm token-ul pentru folosire ulterioară
      }
      setStatus(`Login Status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">Backend Connection Tester</h2>
      
      <div className="space-y-4">
        <button 
          onClick={testRegister}
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-500 hover:bg-green-600'
          } text-white`}
        >
          {isLoading ? 'Processing...' : 'Test Register'}
        </button>

        <button 
          onClick={testLogin}
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {isLoading ? 'Processing...' : 'Test Login'}
        </button>

        {status && (
          <div className="bg-gray-100 p-4 rounded">
            <pre className="whitespace-pre-wrap text-sm overflow-auto">{status}</pre>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthTester;