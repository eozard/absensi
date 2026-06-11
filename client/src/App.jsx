/*
 * App routes for the web UI (login, admin, mahasiswa).
 * Uses role-based protected routes.
 */
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import MahasiswaDashboard from "./pages/MahasiswaDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PendaftaranPage from "./pages/PendaftaranPage";
import AdminPendaftaranPage from "./pages/AdminPendaftaranPage";
import LogbookPage from "./pages/LogbookPage";
import AdminLogbookPage from "./pages/AdminLogbookPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/pendaftaran" element={<PendaftaranPage />} />
        <Route path="/admin_pendaftaran" element={<AdminPendaftaranPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["mahasiswa", "anak_smk"]}>
              <MahasiswaDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/logbook"
          element={
            <ProtectedRoute allowedRoles={["mahasiswa", "anak_smk"]}>
              <LogbookPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/logbook"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLogbookPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
