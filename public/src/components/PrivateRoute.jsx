// src/components/PrivateRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { auth } from '../firebaseConfig'; // Ensure correct path
import { onAuthStateChanged } from 'firebase/auth';

const PrivateRoute = ({ children }) => {
  const { id } = useParams(); // Extract 'id' from the route
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    // Loading indicator while checking auth status
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (!user || user.uid !== id) {
    // If not authenticated or 'id' doesn't match, redirect to home
    return <Navigate to="/" replace />;
  }

  // If authenticated and 'id' matches, render the child components
  return children;
};

export default PrivateRoute;
