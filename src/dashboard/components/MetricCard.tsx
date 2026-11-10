import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';

interface MetricCardProps {
  title: string;
  value: number | undefined;
  prev?: number;
  format?: 'number' | 'percent';
  loading: boolean;
  subtitle?: string;
  subtitleHint?: string;
}

export function MetricCard({
  title,
  value,
  prev,
  format = 'number',
  loading,
  subtitle,
  subtitleHint,
}: MetricCardProps): JSX.Element {
  const display =
    value == null
      ? '—'
      : format === 'percent'
        ? `${(value * 100).toFixed(1)}%`
        : value.toLocaleString('pt-BR');

  const delta =
    prev != null && value != null && prev !== 0
      ? ((value - prev) / prev) * 100
      : null;

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        {loading ? (
          <div className="mt-2 h-8 w-24 animate-pulse rounded bg-muted" />
        ) : (
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold">{display}</span>
            {subtitle && (
              <span
                className="cursor-default text-xs text-muted-foreground"
                title={subtitleHint}
              >
                {subtitle}
              </span>
            )}
            {delta !== null && (
              <span
                className={`flex items-center gap-0.5 text-xs font-medium ${
                  delta >= 0 ? 'text-green-600' : 'text-red-500'
                }`}
              >
                {delta >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {delta >= 0 ? '+' : ''}
                {delta.toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
