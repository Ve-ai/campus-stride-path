import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/components/auth/LoginPage";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Overview } from "@/pages/dashboard/Overview";
import { Courses } from "@/pages/dashboard/Courses";
import { CourseDetails } from "@/pages/dashboard/CourseDetails";
import { SubjectDetails } from "@/pages/dashboard/SubjectDetails";
import { Classes } from "@/pages/dashboard/Classes";
import { ClassDetails } from "@/pages/dashboard/ClassDetails";
import { ClassDirectors } from "@/pages/dashboard/ClassDirectors";
import { Teachers } from "@/pages/dashboard/Teachers";
import { TeacherDetails } from "@/pages/dashboard/TeacherDetails";
import { Finance } from "@/pages/dashboard/Finance";
import { StudentFinanceDetails } from "@/pages/dashboard/StudentFinanceDetails";
import { Students } from "@/pages/dashboard/Students";
import { Profile } from "@/pages/dashboard/Profile";
import { Settings } from "@/pages/dashboard/Settings";
import { Grades } from "@/pages/dashboard/Grades";
import { FaltasProfessoresPage } from "@/pages/dashboard/FaltasProfessores";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="cursos" element={<Courses />} />
        <Route path="cursos/:courseId" element={<CourseDetails />} />
        <Route path="disciplinas/:subjectId" element={<SubjectDetails />} />
        <Route path="turmas" element={<Classes />} />
        <Route path="turmas/:classId" element={<ClassDetails />} />
        <Route path="estudantes" element={<Students />} />
        <Route path="diretores" element={<ClassDirectors />} />
        <Route path="professores" element={<Teachers />} />
        <Route path="professores/:teacherId" element={<TeacherDetails />} />
        <Route path="financas" element={<Finance />} />
        <Route path="financas/estudante/:studentId" element={<StudentFinanceDetails />} />
        {/* Rotas específicas para o Gestor Financeiro apontando para o mesmo painel */}
        <Route path="turmas-pagamentos" element={<Finance />} />
        <Route path="relatorios" element={<Finance />} />
        <Route path="perfil" element={<Profile />} />
        <Route path="configuracoes" element={<Settings />} />
        <Route path="notas" element={<Grades />} />
        <Route path="faltas-professores" element={<FaltasProfessoresPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
