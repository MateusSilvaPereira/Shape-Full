import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "@/app/router";
import { AuthProvider } from "@/features/auth/AuthContext";
import { ThemeProvider } from "@/features/theme/ThemeContext";
import { ToastProvider } from "@/components/ui/toast/ToastContext";
import { LoadingOverlayProvider } from "@/components/ui/loading/LoadingOverlayContext";
import { queryClient } from "@/lib/queryClient";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <LoadingOverlayProvider>
            <BrowserRouter>
              <AuthProvider>
                <AppRouter />
              </AuthProvider>
            </BrowserRouter>
          </LoadingOverlayProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
