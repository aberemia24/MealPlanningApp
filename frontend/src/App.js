import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RecipePage from './pages/RecipePage';
import AuthTester from './components/test/AuthTester';
import RecipesTester from './components/test/RecipesTester';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RecipePage />} />
        <Route path="/test/auth" element={<AuthTester />} />
        <Route path="/test/recipes" element={<RecipesTester />} />
      </Routes>
    </Router>
  );
}

export default App;
