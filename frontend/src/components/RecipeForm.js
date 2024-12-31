import React, { useState } from 'react';

function RecipeForm() {
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '' }]);
  const [steps, setSteps] = useState(['']);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newRecipe = { name, ingredients, steps };

    await fetch('http://localhost:5000/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecipe),
    });

    setName('');
    setIngredients([{ name: '', quantity: '' }]);
    setSteps(['']);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add Recipe</h2>
      <div>
        <label>Name:</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label>Ingredients:</label>
        {ingredients.map((ingredient, index) => (
          <div key={index}>
            <input
              placeholder="Name"
              value={ingredient.name}
              onChange={(e) =>
                setIngredients(
                  ingredients.map((ing, i) =>
                    i === index ? { ...ing, name: e.target.value } : ing
                  )
                )
              }
            />
            <input
              placeholder="Quantity"
              value={ingredient.quantity}
              onChange={(e) =>
                setIngredients(
                  ingredients.map((ing, i) =>
                    i === index ? { ...ing, quantity: e.target.value } : ing
                  )
                )
              }
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setIngredients([...ingredients, { name: '', quantity: '' }])
          }
        >
          Add Ingredient
        </button>
      </div>
      <div>
        <label>Steps:</label>
        {steps.map((step, index) => (
          <div key={index}>
            <textarea
              value={step}
              onChange={(e) =>
                setSteps(steps.map((s, i) => (i === index ? e.target.value : s)))
              }
            />
          </div>
        ))}
        <button type="button" onClick={() => setSteps([...steps, ''])}>
          Add Step
        </button>
      </div>
      <button type="submit">Save Recipe</button>
    </form>
  );
}

export default RecipeForm;
