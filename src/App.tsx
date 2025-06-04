import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Gallery from "./pages/Gallery";
import Bookmarks from "./pages/Bookmarks";
import AdminUpload from "./pages/AdminUpload";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import ConversionPage from "./pages/ConversionPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/admin/upload" element={<AdminUpload />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/convert" element={<ConversionPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
