import React, { useEffect, useState } from 'react';
import RecipeList from '../components/RecipeList';
import RecipeForm from '../components/RecipeForm';

function RecipePage() {
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/recipes');
        if (!response.ok) {
          throw new Error('Failed to fetch recipes');
        }
        const data = await response.json();
        setRecipes(data.data);
      } catch (error) {
        console.error('Error fetching recipes:', error);
      }
    };

    fetchRecipes();
  }, []);

  const handleRecipeAdded = (newRecipe) => {
    setRecipes((prevRecipes) => [newRecipe, ...prevRecipes]);
  };

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">Meal Planning App</h1>
      <RecipeForm onRecipeAdded={handleRecipeAdded} />
      <RecipeList recipes={recipes} />
    </div>
  );
}

export default RecipePage;
