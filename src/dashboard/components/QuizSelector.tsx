import { ChevronDown } from 'lucide-react';
import { useQuizSelector } from '@/dashboard/store/quizSelector';

export function QuizSelector(): JSX.Element {
  const quizzes = useQuizSelector((s) => s.quizzes);
  const selectedSlug = useQuizSelector((s) => s.selectedSlug);
  const loading = useQuizSelector((s) => s.loading);
  const setSlug = useQuizSelector((s) => s.setSlug);

  if (loading && quizzes.length === 0) {
    return (
      <div className="h-9 animate-pulse rounded-md bg-muted" />
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="rounded-md border border-dashed px-2 py-1.5 text-xs text-muted-foreground">
        Nenhum quiz ativo
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        value={selectedSlug ?? ''}
        onChange={(e) => setSlug(e.target.value)}
        className="h-9 w-full appearance-none rounded-md border border-input bg-background pl-3 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {quizzes.map((q) => (
          <option key={q.slug} value={q.slug}>
            {q.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
