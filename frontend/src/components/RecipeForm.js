import React, { useState } from 'react';

function RecipeForm({ onRecipeAdded }) {
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '', unit: '' }]);
  const [steps, setSteps] = useState(['']);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Recipe name is required.');
      return;
    }

    const newRecipe = { name, ingredients, steps };

    try {
      const response = await fetch('http://localhost:5000/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecipe),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        setError(`Server Error: ${errorMessage}`);
        return;
      }

      const data = await response.json();
      if (onRecipeAdded) {
        onRecipeAdded(data.data);
      }

      setName('');
      setIngredients([{ name: '', quantity: '', unit: '' }]);
      setSteps(['']);
    } catch (error) {
      setError('Something went wrong. Please try again later.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 mb-8">
      <h2 className="text-lg font-bold mb-4">Add Recipe</h2>
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      {/* Nume */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded-lg p-2"
          placeholder="Enter recipe name"
        />
      </div>

      {/* Ingrediente */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Ingredients</label>
        {ingredients.map((ingredient, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <input
              type="text"
              placeholder="Name"
              value={ingredient.name}
              onChange={(e) =>
                setIngredients(
                  ingredients.map((ing, i) =>
                    i === index ? { ...ing, name: e.target.value } : ing
                  )
                )
              }
              className="flex-1 border rounded-lg p-2"
            />
            <input
              type="text"
              placeholder="Quantity"
              value={ingredient.quantity}
              onChange={(e) =>
                setIngredients(
                  ingredients.map((ing, i) =>
                    i === index ? { ...ing, quantity: e.target.value } : ing
                  )
                )
              }
              className="w-24 border rounded-lg p-2"
            />
            <input
              type="text"
              placeholder="Unit"
              value={ingredient.unit}
              onChange={(e) =>
                setIngredients(
                  ingredients.map((ing, i) =>
                    i === index ? { ...ing, unit: e.target.value } : ing
                  )
                )
              }
              className="w-24 border rounded-lg p-2"
            />
            <button
              type="button"
              onClick={() => setIngredients(ingredients.filter((_, i) => i !== index))}
              className="text-red-500"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setIngredients([...ingredients, { name: '', quantity: '', unit: '' }])}
          className="text-blue-500 text-sm"
        >
          Add Ingredient
        </button>
      </div>

      {/* Pași */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Steps</label>
        {steps.map((step, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <textarea
              placeholder={`Step ${index + 1}`}
              value={step}
              onChange={(e) =>
                setSteps(steps.map((s, i) => (i === index ? e.target.value : s)))
              }
              className="flex-1 border rounded-lg p-2"
            />
            <button
              type="button"
              onClick={() => setSteps(steps.filter((_, i) => i !== index))}
              className="text-red-500"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setSteps([...steps, ''])}
          className="text-blue-500 text-sm"
        >
          Add Step
        </button>
      </div>

      <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded-lg">
        Save Recipe
      </button>
    </form>
  );
}

export default RecipeForm;
