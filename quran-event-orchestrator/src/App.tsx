import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { MainLayout } from "./components/layout/MainLayout";
import { LoadingScreen } from "./components/LoadingScreen";

// Lazy load pages for better code splitting
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const UsersSettings = lazy(() => import("./pages/UsersSettings"));
const ManageEvents = lazy(() => import("./pages/ManageEvents"));
const ViewParties = lazy(() => import("./pages/ViewParties"));
const LanguageSettings = lazy(() => import("./pages/LanguageSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <LanguageProvider>
          <AuthProvider>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredPermission="dashboard">
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute requiredPermission="users">
                    <MainLayout>
                      <UsersSettings />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events"
                element={
                  <ProtectedRoute requiredPermission="events">
                    <MainLayout>
                      <ManageEvents />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parties"
                element={
                  <ProtectedRoute requiredPermission="parties">
                    <MainLayout>
                      <ViewParties />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/language-settings"
                element={
                  <ProtectedRoute requiredPermission="language-settings">
                    <MainLayout>
                      <LanguageSettings />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;