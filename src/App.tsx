import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { QuizPage } from '@/quiz/pages/QuizPage';
import { LoginPage } from '@/dashboard/pages/LoginPage';
import { DashboardLayout } from '@/dashboard/components/DashboardLayout';
import { AuthGuard } from '@/dashboard/components/AuthGuard';
import { Overview } from '@/dashboard/pages/Overview';
import { Funnel } from '@/dashboard/pages/Funnel';
import { Origin } from '@/dashboard/pages/Origin';
import { NotFoundPage } from '@/shared/pages/NotFoundPage';

function RootRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/q/treino-em-casa-es${search}`} replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/q/:slug" element={<QuizPage />} />

      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <AuthGuard>
            <DashboardLayout />
          </AuthGuard>
        }
      >
        <Route index element={<Overview />} />
        <Route path="funnel" element={<Funnel />} />
        <Route path="origin" element={<Origin />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
