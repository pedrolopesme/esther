"use client";

import StudentStudyDashboard from "../components/StudentStudyDashboard";
import ParentDashboard from "../components/ParentDashboard";
import LandingPage from "../components/LandingPage";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
  const { isAuthenticated, isParent, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-ink-soft">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-lilac/30 border-t-lilac" />
          <span className="text-sm font-semibold">Carregando Esther...</span>
        </div>
      </div>
    );
  }

  if (isParent) return <ParentDashboard />;

  return isAuthenticated ? <StudentStudyDashboard /> : <LandingPage />;
}
