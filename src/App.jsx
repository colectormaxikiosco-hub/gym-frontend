import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Configuration from "./pages/Configuration"
import Clients from "./pages/Clients"
import Memberships from "./pages/Memberships"
import MembershipReports from "./pages/MembershipReports"
import Reportes from "./pages/Reportes"
import ClientPortal from "./pages/ClientPortal"
import ClientProfile from "./pages/ClientProfile"
import PrivateRoute from "./components/PrivateRoute"
import RoleBasedRoute from "./components/RoleBasedRoute"
import { AuthProvider } from "./context/AuthContext"
import CashRegister from "./pages/CashRegister"
import CashSessionHistory from "./pages/CashSessionHistory"
import CashSessionDetail from "./pages/CashSessionDetail"
import Products from "./pages/Products"
import Sales from "./pages/Sales"
import SalesReports from "./pages/SalesReports"
import MainLayout from "./components/layouts/MainLayout"

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Rutas para Admin y Empleado */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={["admin", "empleado"]}>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/clients"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={["admin", "empleado"]}>
                  <MainLayout>
                    <Clients />
                  </MainLayout>
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/memberships"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={["admin", "empleado"]}>
                  <MainLayout>
                    <Memberships />
                  </MainLayout>
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/memberships/reportes"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={["admin", "empleado"]}>
                  <MainLayout>
                    <MembershipReports />
                  </MainLayout>
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/reportes"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={["admin", "empleado"]}>
                  <MainLayout>
                    <Reportes />
                  </MainLayout>
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/products"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={["admin"]}>
                  <MainLayout>
                    <Products />
                  </MainLayout>
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/ventas"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={["admin", "empleado"]}>
                  <MainLayout>
                    <Sales />
                  </MainLayout>
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/ventas/reportes"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={["admin", "empleado"]}>
                  <MainLayout>
                    <SalesReports />
                  </MainLayout>
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />

          {/* Ruta solo para Admin */}
          <Route
            path="/configuration"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={["admin", "empleado"]}>
                  <MainLayout>
                    <Configuration />
                  </MainLayout>
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />

          {/* Rutas para Clientes */}
          <Route
            path="/client-portal"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={["client"]}>
                  <MainLayout>
                    <ClientPortal />
                  </MainLayout>
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/client-profile"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={["client"]}>
                  <MainLayout>
                    <ClientProfile />
                  </MainLayout>
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />

          {/* Rutas de Caja */}
          <Route
            path="/caja"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={["admin", "empleado"]}>
                  <MainLayout>
                    <CashRegister />
                  </MainLayout>
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/caja/historial"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={["admin", "empleado"]}>
                  <MainLayout>
                    <CashSessionHistory />
                  </MainLayout>
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/caja/sesion/:id"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={["admin", "empleado"]}>
                  <MainLayout>
                    <CashSessionDetail />
                  </MainLayout>
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
