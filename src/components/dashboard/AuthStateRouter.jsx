import { useAuth } from "@/lib/AuthContext";
import { Navigate } from "react-router-dom";
import Home from "@/pages/Home";

export default function AuthStateRouter() {
  const { user } = useAuth();
  // Auth State Router: guests see the public marketing homepage;
  // authenticated users are instantly redirected to their Overview Dashboard.
  if (user) return <Navigate to="/dashboard" replace />;
  return <Home />;
}