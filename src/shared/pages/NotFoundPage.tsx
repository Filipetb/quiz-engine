import { Link } from 'react-router-dom';

import { buttonVariants } from '@/shared/ui/button';
import { cn } from '@/shared/utils/cn';

export function NotFoundPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-sm text-muted-foreground">
        A rota que você acessou não existe.
      </p>
      <Link to="/" className={cn(buttonVariants({ variant: 'default' }))}>
        Voltar para o início
      </Link>
    </main>
  );
}
