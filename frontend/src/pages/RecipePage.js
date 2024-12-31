import React, { useState, useEffect } from 'react';
import RecipeList from '../components/RecipeList';
import RecipeForm from '../components/RecipeForm';

function RecipePage() {
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    const fetchRecipes = async () => {
      const response = await fetch('http://localhost:5000/api/recipes');
      const data = await response.json();
      setRecipes(data.data);
    };

    fetchRecipes();
  }, []);

  return (
    <div>
      <h1>Meal Planning App</h1>
      <RecipeForm />
      <RecipeList recipes={recipes} />
    </div>
  );
}

export default RecipePage;
