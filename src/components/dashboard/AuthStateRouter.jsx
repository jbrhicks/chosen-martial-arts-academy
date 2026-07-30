import { useAuth } from "@/lib/AuthContext";
import { Navigate } from "react-router-dom";
import Home from "@/pages/Home";

export default function AuthStateRouter() {
  const { user } = useAuth();
  // Auth State Router: guests see the public marketing homepage;
  // authenticated users land on the dashboard for their role —
  // admins go to the Admin Command Center, members go to their Overview Dashboard.
  if (user) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }
  return <Home />;
}