// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { SkillsProvider } from './Context/skills';
import TestPage from './components/TestPage';
import ExpectationPage from './components/ExpectationPage';
import AdminPage from './components/AdminPage';
import Final from './components/Final';
import PrivateRoute from './components/PrivateRoute'; // Import PrivateRoute

const App = () => {
  return (
    <SkillsProvider>
      <Router>
        <Routes>
          <Route path="/" element={<TestPage />} />
          
          {/* Protected Admin Route with dynamic 'id' */}
          <Route
            path="/:id/admin/*"
            element={
              <PrivateRoute>
                <AdminPage />
              </PrivateRoute>
            }
          />

          <Route path="/expectation" element={<ExpectationPage />} />
          <Route path="/final" element={<Final />} />
        </Routes>
      </Router>
    </SkillsProvider>
  );
};

export default App;