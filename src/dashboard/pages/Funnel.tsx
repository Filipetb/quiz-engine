import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { DateFilter } from '@/dashboard/components/DateFilter';
import { useDateFilter } from '@/dashboard/hooks/useDateFilter';
import { useMetrics } from '@/dashboard/hooks/useMetrics';
import {
  fetchFunnel,
  type FunnelResponse,
  type FunnelStep,
} from '@/dashboard/data/metrics';
import { useQuizSelector } from '@/dashboard/store/quizSelector';

export function Funnel(): JSX.Element {
  const filter = useDateFilter();
  const quizSlug = useQuizSelector((s) => s.selectedSlug);
  const { data, loading, error } = useMetrics<FunnelResponse>(
    () =>
      fetchFunnel({
        quiz_slug: quizSlug!,
        date_from: filter.dateFrom,
        date_to: filter.dateTo,
      }),
    [quizSlug, filter.dateFrom, filter.dateTo],
    !!quizSlug,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Funil por Etapas</h2>
        <DateFilter filter={filter} />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversão por etapa</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded bg-muted"
                />
              ))}
            </div>
          ) : data?.funnel && data.funnel.length > 0 ? (
            <FunnelTable steps={data.funnel} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sem dados no período
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function cumulativeRateClass(
  step: FunnelStep,
  index: number,
  total: number,
): string {

  if (index === total - 1) {
    if (step.cumulative_rate < 0.25) return 'text-red-500';
    if (step.cumulative_rate < 0.30) return 'text-orange-500';
    return 'text-green-500';
  }

  return '';
}

function stepRateClass(
  step: FunnelStep,
  index: number,
  total: number,
): string {
  if (index === 0) return '';

  if (index === total - 1) {
    return '';
  }

  const loss = 1 - step.step_rate;

  if (index === 1) return loss >= 0.1 ? 'text-red-500' : '';
  if (index === 2) return loss >= 0.05 ? 'text-red-500' : '';

  if (loss >= 0.035) return 'text-red-500';
  if (loss >= 0.015) return 'text-orange-500';
  return '';
}

function FunnelTable({ steps }: { steps: FunnelStep[] }): JSX.Element {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <th className="pb-2 pr-4">#</th>
            <th className="pb-2 pr-4">Etapa</th>
            <th className="pb-2 pr-4 text-right">Sessões</th>
            <th className="pb-2 pr-4 text-right">Avançaram</th>
            <th className="pb-2 pr-4 text-right">Conv. Acum.</th>
            <th className="pb-2 pr-4 text-right">Conv. Etapa</th>
            {/* <th className="w-48 pb-2" /> */}
          </tr>
        </thead>
        <tbody>
          {steps.map((step, i) => (
            <tr key={step.step_id} className="border-b last:border-0">
              <td className="py-2.5 pr-4 text-muted-foreground">
                {step.step_order}
              </td>
              <td className="py-2.5 pr-4 font-medium">{step.step_id}</td>
              <td className="py-2.5 pr-4 text-right tabular-nums">
                {step.reached.toLocaleString('pt-BR')}
              </td>
              <td className="py-2.5 pr-4 text-right tabular-nums">
                {step.advanced.toLocaleString('pt-BR')}
              </td>
              <td
                className={`py-2.5 pr-4 text-right tabular-nums font-medium ${step.reached > 50 ? cumulativeRateClass(step, i, steps.length) : ''}`}
              >
                {(step.cumulative_rate * 100).toFixed(1)}%
              </td>
              <td className={`py-2.5 pr-4 text-right tabular-nums ${step.reached > 50 ? stepRateClass(step, i, steps.length) : ''}`}>
                {(step.step_rate * 100).toFixed(1)}%
              </td>
              {/* <td className="py-2.5">
                <div className="h-5 w-full rounded-sm bg-muted">
                  <div
                    className="h-full rounded-sm bg-primary/70 transition-all"
                    style={{
                      width: `${(step.reached / maxReached) * 100}%`,
                    }}
                  />
                </div>
              </td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
