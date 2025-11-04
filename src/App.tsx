import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SettingsProvider } from "./contexts/SettingsContext";
import { AuthProvider } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import PatientsList from "./pages/PatientsList";
import PatientProfile from "./pages/PatientProfile";
import AIAnalysis from "./pages/AIAnalysis";
import DrugChecker from "./pages/DrugChecker";
import AIChat from "./pages/AIChat";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <SettingsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                
                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="patients" element={<PatientsList />} />
                    <Route path="patient/:id" element={<PatientProfile />} />
                    <Route path="ai-analysis" element={<AIAnalysis />} />
                    <Route path="drug-checker" element={<DrugChecker />} />
                    <Route path="ai-chat" element={<AIChat />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </SettingsProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
