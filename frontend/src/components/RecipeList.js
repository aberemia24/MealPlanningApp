import React from 'react';

function RecipeList({ recipes }) {
  if (recipes.length === 0) {
    return <p className="text-center text-gray-500">No recipes found.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <div
          key={recipe._id}
          className="border rounded-lg shadow-md p-4 bg-white hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">{recipe.name}</h3>
          <p className="text-sm text-gray-500">Ingredients:</p>
          <ul className="list-disc pl-6 mb-2">
            {recipe.ingredients.map((ing, index) => (
              <li key={index}>{`${ing.name} - ${ing.quantity} ${ing.unit}`}</li>
            ))}
          </ul>
          <p className="text-sm text-gray-500">Steps:</p>
          <ol className="list-decimal pl-6">
            {recipe.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

export default RecipeList;
