import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { DateFilter } from '@/dashboard/components/DateFilter';
import { useDateFilter } from '@/dashboard/hooks/useDateFilter';
import { useMetrics } from '@/dashboard/hooks/useMetrics';
import { fetchOverview, type OverviewResponse } from '@/dashboard/data/metrics';
import { MetricCard } from '@/dashboard/components/MetricCard';
import { useQuizSelector } from '@/dashboard/store/quizSelector';

export function Overview(): JSX.Element {
  const filter = useDateFilter();
  const quizSlug = useQuizSelector((s) => s.selectedSlug);
  const { data, loading, error } = useMetrics<OverviewResponse>(
    () =>
      fetchOverview({
        quiz_slug: quizSlug!,
        date_from: filter.dateFrom,
        date_to: filter.dateTo,
        compare: filter.compare,
      }),
    [quizSlug, filter.dateFrom, filter.dateTo, filter.compare],
    !!quizSlug,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Visão Geral</h2>
        <DateFilter filter={filter} />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Visitas"
          value={data?.totals.visits}
          prev={data?.comparison?.totals.visits}
          loading={loading}
          subtitle={
            data?.trafficQuality
              ? `(${(data.trafficQuality.human + data.trafficQuality.suspect + data.trafficQuality.bot).toLocaleString('pt-BR')})`
              : undefined
          }
          subtitleHint="Total incluindo bots. O número principal exibe apenas humanos e suspeitos."
        />
        <MetricCard
          title="Interações"
          value={data?.totals.starts}
          prev={data?.comparison?.totals.starts}
          loading={loading}
        />
        <MetricCard
          title="Taxa de Interação"
          value={data?.totals.interactionRate}
          prev={data?.comparison?.totals.interactionRate}
          format="percent"
          loading={loading}
        />
        <MetricCard
          title="Cliques Finais"
          value={data?.totals.final_clicks}
          prev={data?.comparison?.totals.final_clicks}
          loading={loading}
          subtitle={
            data?.totals?.starts && data?.totals?.final_clicks
              ? `(${(data.totals.final_clicks / data.totals.starts *100).toFixed(1)}%)`
              : undefined
          }
          subtitleHint="Porcentagem de pessoas que iniciaram o quiz e foram pro checkout."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução diária</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : data?.daily && data.daily.length > 0 ? (
            <DailyChart daily={aggregateDailyByDate(data.daily)} />
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              Sem dados no período
            </div>
          )}
        </CardContent>
      </Card>

      <TrafficQualityCard quality={data?.trafficQuality} loading={loading} />
    </div>
  );
}

interface TrafficQuality {
  human: number;
  suspect: number;
  bot: number;
}

function TrafficQualityCard({
  quality,
  loading,
}: {
  quality: TrafficQuality | undefined;
  loading: boolean;
}): JSX.Element {
  const total = quality ? quality.human + quality.suspect + quality.bot : 0;
  const pct = (n: number) =>
    total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '—';

  const items = [
    {
      label: 'Humano',
      value: quality?.human ?? 0,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950',
    },
    {
      label: 'Suspeito',
      value: quality?.suspect ?? 0,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950',
    },
    {
      label: 'Bot',
      value: quality?.bot ?? 0,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Qualidade do Tráfego</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.label} className={`rounded-lg p-4 ${item.bg}`}>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              {loading ? (
                <div className="mt-2 h-6 w-16 animate-pulse rounded bg-muted" />
              ) : (
                <>
                  <p className={`mt-1 text-2xl font-semibold tabular-nums ${item.color}`}>
                    {item.value.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-muted-foreground">{pct(item.value)}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface DailyAgg {
  date: string;
  visits: number;
  starts: number;
  final_clicks: number;
}

function aggregateDailyByDate(
  rows: { date_bucket: string; visits: number; starts: number; final_clicks: number }[],
): DailyAgg[] {
  const map = new Map<string, DailyAgg>();
  for (const r of rows) {
    const d = r.date_bucket.slice(0, 10);
    const existing = map.get(d);
    if (existing) {
      existing.visits += Number(r.visits);
      existing.starts += Number(r.starts);
      existing.final_clicks += Number(r.final_clicks);
    } else {
      map.set(d, {
        date: d,
        visits: Number(r.visits),
        starts: Number(r.starts),
        final_clicks: Number(r.final_clicks),
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function DailyChart({ daily }: { daily: DailyAgg[] }): JSX.Element {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={daily} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(v: string) => v.slice(5)}
        />
        <YAxis tick={{ fontSize: 12 }} width={40} />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: '1px solid hsl(var(--border))',
          }}
        />
        <Line
          type="monotone"
          dataKey="visits"
          name="Visitas"
          stroke="hsl(220, 70%, 50%)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="starts"
          name="Interações"
          stroke="hsl(142, 70%, 45%)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="final_clicks"
          name="Cliques Finais"
          stroke="hsl(280, 65%, 55%)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
