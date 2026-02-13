"use client"

import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-600">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirigir según el rol
    if (user.role === "client") {
      return <Navigate to="/client-portal" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default RoleBasedRoute
