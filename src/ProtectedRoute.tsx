import React from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles?: string[]; // optional role-based restriction
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  // Retrieve session data from localStorage
  const sessionData = localStorage.getItem("userSession");

  if (!sessionData) {
    // Not logged in
    return <Navigate to="/" replace />;
  }

  try {
    const parsedSession = JSON.parse(sessionData);

    const isLoggedIn = parsedSession?.IsLoggedIn === true;
    const hasSession = Boolean(parsedSession?.SessionID);
    const userRole = parsedSession?.Role || parsedSession?.RoleCode;

    // Check login validity
    if (!isLoggedIn || !hasSession) {
      return <Navigate to="/" replace />;
    }

    // Optional: Role-based protection
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }

    // Authenticated and authorized
    return children;
  } catch (error) {
    console.error("Invalid session data:", error);
    localStorage.removeItem("userSession");
    return <Navigate to="/" replace />;
  }
};

export default ProtectedRoute;
