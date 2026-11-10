import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, Eye, Globe, LogOut } from 'lucide-react';
import { supabase } from '@/shared/supabase/client';
import { useAuth } from '@/shared/hooks/useAuth';
import { Button } from '@/shared/ui/button';
import { QuizSelector } from '@/dashboard/components/QuizSelector';
import { useQuizSelector } from '@/dashboard/store/quizSelector';

const NAV_ITEMS = [
  { to: '/admin', label: 'Visão Geral', icon: Eye, end: true },
  { to: '/admin/funnel', label: 'Funil', icon: BarChart3, end: false },
  { to: '/admin/origin', label: 'Origens', icon: Globe, end: false },
];

export function DashboardLayout(): JSX.Element {
  const { user } = useAuth();
  const loadQuizzes = useQuizSelector((s) => s.loadQuizzes);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  return (
    <div className="flex h-full">
      <aside className="flex w-56 shrink-0 flex-col border-r bg-card">
        <div className="border-b px-4 py-4">
          <h1 className="text-lg font-bold">QuizEngine</h1>
          <p className="text-xs text-muted-foreground">Dashboard</p>
        </div>

        <div className="border-b p-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Quiz
          </p>
          <QuizSelector />
        </div>

        <nav className="flex-1 space-y-0.5 p-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-3">
          <div className="mb-2 truncate text-xs text-muted-foreground">
            {user?.email}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => supabase.auth.signOut()}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-background p-6">
        <Outlet />
      </main>
    </div>
  );
}
