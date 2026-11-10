import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { DateFilter } from '@/dashboard/components/DateFilter';
import { useDateFilter } from '@/dashboard/hooks/useDateFilter';
import { useMetrics } from '@/dashboard/hooks/useMetrics';
import {
  fetchOrigin,
  type OriginResponse,
  type OriginRow,
} from '@/dashboard/data/metrics';
import { useQuizSelector } from '@/dashboard/store/quizSelector';

export function Origin(): JSX.Element {
  const filter = useDateFilter();
  const quizSlug = useQuizSelector((s) => s.selectedSlug);
  const { data, loading, error } = useMetrics<OriginResponse>(
    () =>
      fetchOrigin({
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
        <h2 className="text-2xl font-bold">Origens</h2>
        <DateFilter filter={filter} />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Métricas por origem</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded bg-muted"
                />
              ))}
            </div>
          ) : data?.origins && data.origins.length > 0 ? (
            <OriginTable rows={data.origins} />
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

function OriginTable({ rows }: { rows: OriginRow[] }): JSX.Element {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <th className="pb-2 pr-4">Origem</th>
            <th className="pb-2 pr-4 text-right">Visitas</th>
            <th className="pb-2 pr-4 text-right">Interações</th>
            <th className="pb-2 pr-4 text-right">Taxa Interação</th>
            <th className="pb-2 pr-4 text-right">Cliques Finais</th>
            <th className="pb-2 text-right">Taxa Conclusão</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.source} className="border-b last:border-0">
              <td className="py-2.5 pr-4 font-medium">{row.source}</td>
              <td className="py-2.5 pr-4 text-right tabular-nums">
                {row.visits.toLocaleString('pt-BR')}
              </td>
              <td className="py-2.5 pr-4 text-right tabular-nums">
                {row.starts.toLocaleString('pt-BR')}
              </td>
              <td className="py-2.5 pr-4 text-right tabular-nums">
                {(row.interactionRate * 100).toFixed(1)}%
              </td>
              <td className="py-2.5 pr-4 text-right tabular-nums">
                {row.final_clicks.toLocaleString('pt-BR')}
              </td>
              <td className="py-2.5 text-right tabular-nums">
                {(row.completionRate * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
