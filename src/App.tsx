
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ResumesProvider } from "@/hooks/use-resumes";
import { SettingsProvider } from "@/hooks/use-settings";
import { ThemeProvider } from "@/hooks/use-theme";
import MainLayout from "@/components/layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import Jobs from "@/pages/Jobs";
import Resumes from "@/pages/Resumes";
import Settings from "@/pages/Settings";
import Agent from "@/pages/Agent";
import NotFound from "@/pages/NotFound";

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
        <ResumesProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="jobs" element={<Jobs />} />
                  <Route path="resumes" element={<Resumes />} />
                  <Route path="agent" element={<Agent />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ResumesProvider>
      </ThemeProvider>
    </SettingsProvider>
  </QueryClientProvider>
);

export default App;
