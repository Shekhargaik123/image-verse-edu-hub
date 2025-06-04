import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function Admin() {
  const { isAdmin, loading } = useAuth();

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (!isAdmin) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-lg text-gray-700">Welcome, Admin! Here you can manage the platform.</p>
      {/* Add admin dashboard features here */}
    </div>
  );
} 