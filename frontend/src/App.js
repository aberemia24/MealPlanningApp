import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RecipePage from './pages/RecipePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RecipePage />} />
      </Routes>
    </Router>
  );
}

export default App;
