import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { QuizThemeProvider } from '@/quiz/engine/QuizThemeProvider';
import { StepRenderer } from '@/quiz/engine/StepRenderer';
import { useQuizHead } from '@/quiz/engine/useQuizHead';
import { quizSchemaValidator } from '@/quiz/engine/schema';
import type { QuizSchema } from '@/quiz/engine/types';
import { useQuizSession } from '@/quiz/store/session';
import { useQuizTracking } from '@/quiz/tracking/useQuizTracking';
import advancedSchemaRaw from '@/quiz/schemas/advanced.json';
import mockSchemaRaw from '@/quiz/schemas/mock.json';
import playgroundSchemaRaw from '@/quiz/schemas/playground.json';
import treinoEmCasaEsSchemaRaw from '@/quiz/schemas/treino-em-casa-es.json';
import treinoEmCasaEnSchemaRaw from '@/quiz/schemas/treino-em-casa-en.json';
import agentSampleSchemaRaw from '@/quiz/schemas/agent-sample.json';
import sonoDoBebeSchemaRaw from '@/quiz/schemas/sono-do-bebe.json';
import sonoDoBebeV2SchemaRaw from '@/quiz/schemas/sono-do-bebe-v2.json';
import gluteosESSchemaRaw from '@/quiz/schemas/quiz-gluteos-es.json';

const SCHEMA_REGISTRY: Record<string, unknown> = {
  mock: mockSchemaRaw,
  playground: playgroundSchemaRaw,
  advanced: advancedSchemaRaw,
  'treino-em-casa-es': treinoEmCasaEsSchemaRaw,
  'treino-em-casa-en': treinoEmCasaEnSchemaRaw,
  agentsample: agentSampleSchemaRaw,
  'sono-do-bebe': sonoDoBebeSchemaRaw,
  'sono-do-bebe-v2': sonoDoBebeV2SchemaRaw,
  gluteosES: gluteosESSchemaRaw
};

interface LoadedSchema {
  schema: QuizSchema | null;
  error: string | null;
}

function loadSchema(slug: string | undefined): LoadedSchema {
  if (!slug) return { schema: null, error: 'Slug não informado.' };
  const raw = SCHEMA_REGISTRY[slug];
  if (!raw) return { schema: null, error: `Quiz "${slug}" não existe.` };
  const parsed = quizSchemaValidator.safeParse(raw);
  if (!parsed.success) {
    return {
      schema: null,
      error: `Schema inválido: ${parsed.error.issues
        .slice(0, 3)
        .map((i) => i.message)
        .join('; ')}`,
    };
  }
  return { schema: parsed.data as QuizSchema, error: null };
}

export function QuizPage(): JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const [loaded] = useState<LoadedSchema>(() => loadSchema(slug));
  const initialize = useQuizSession((s) => s.initialize);
  const currentQuizId = useQuizSession((s) => s.quizId);

  useQuizTracking(loaded.schema);
  useQuizHead(loaded.schema?.head, loaded.schema?.quiz.id ?? '');

  useEffect(() => {
    if (!loaded.schema) return;
    if (currentQuizId !== loaded.schema.quiz.id) {
      initialize(loaded.schema, { slug });
    }
  }, [loaded.schema, currentQuizId, initialize, slug]);

  const theme = useMemo(() => loaded.schema?.theme, [loaded.schema]);

  if (loaded.error || !loaded.schema) {
    return (
      <main className="flex min-h-full items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-2">
          <h1 className="text-xl font-semibold">Quiz indisponível</h1>
          <p className="text-sm text-muted-foreground">
            {loaded.error ?? 'Schema não encontrado.'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <QuizThemeProvider theme={theme} className="min-h-full">
      <StepRenderer schema={loaded.schema} />
    </QuizThemeProvider>
  );
}
