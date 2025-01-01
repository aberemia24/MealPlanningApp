// src/components/test/RecipesTester.js
import React, { useState } from 'react';

const RecipesTester = () => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  const testCreateRecipe = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: "Test Recipe",
          ingredients: [{
            name: "Test Ingredient",
            quantity: 100,
            unit: "g"
          }],
          steps: ["Step 1", "Step 2"],
          nutrition: {
            calories: 200,
            protein: 10,
            carbs: 20,
            fat: 5
          },
          isVegetarian: true,
          prepTime: 30,
          difficulty: "easy"
        }),
      });
      
      const data = await response.json();
      setStatus(`Create Recipe Status: ${response.status}, Response: ${JSON.stringify(data)}`);
    } catch (err) {
      setError(`Error: ${err.message}`);
    }
  };

  const testGetRecipes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/recipes', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });
      
      const data = await response.json();
      setStatus(`Get Recipes Status: ${response.status}, Response: ${JSON.stringify(data)}`);
    } catch (err) {
      setError(`Error: ${err.message}`);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">Recipe API Tester</h2>
      
      <div className="space-y-4">
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter JWT Token"
          className="w-full p-2 border rounded"
        />

        <button 
          onClick={testCreateRecipe}
          className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
        >
          Test Create Recipe
        </button>

        <button 
          onClick={testGetRecipes}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Test Get Recipes
        </button>

        {status && (
          <div className="bg-gray-100 p-4 rounded">
            <pre className="whitespace-pre-wrap text-sm">{status}</pre>
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

export default RecipesTester;