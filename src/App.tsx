
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ResumesProvider } from "@/hooks/use-resumes";
import { SettingsProvider } from "@/hooks/use-settings";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/use-auth";
import { JobsProvider } from "@/hooks/use-jobs";
import MainLayout from "@/components/layout/MainLayout";
import AuthLayout from "@/components/auth/AuthLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import Jobs from "@/pages/Jobs";
import Resumes from "@/pages/Resumes";
import Settings from "@/pages/Settings";
import Agent from "@/pages/Agent";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/auth/Login";
import SignUp from "@/pages/auth/SignUp";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import UpdatePassword from "@/pages/auth/UpdatePassword";

const queryClient = new QueryClient();

// Add font imports to the document head
const fontStyles = document.createElement('style');
fontStyles.innerHTML = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap');
`;
document.head.appendChild(fontStyles);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SettingsProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <JobsProvider>
              <ResumesProvider>
                <TooltipProvider>
                  <Toaster />
                  <Routes>
                    {/* Auth routes */}
                    <Route path="/auth" element={<AuthLayout />}>
                      <Route path="login" element={<Login />} />
                      <Route path="signup" element={<SignUp />} />
                      <Route path="forgot-password" element={<ForgotPassword />} />
                      <Route path="update-password" element={<UpdatePassword />} />
                    </Route>
                    
                    {/* Protected routes */}
                    <Route path="/" element={
                      <ProtectedRoute>
                        <MainLayout />
                      </ProtectedRoute>
                    }>
                      <Route index element={<Dashboard />} />
                      <Route path="jobs" element={<Jobs />} />
                      <Route path="resumes" element={<Resumes />} />
                      <Route path="agent" element={<Agent />} />
                      <Route path="reports" element={<Reports />} />
                      <Route path="settings" element={<Settings />} />
                    </Route>
                    
                    {/* Redirect / to /auth/login when no path is specified */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </TooltipProvider>
              </ResumesProvider>
            </JobsProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </SettingsProvider>
  </QueryClientProvider>
);

export default App;
