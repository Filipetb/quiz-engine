import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { cn } from '@/shared/utils/cn';
import type {
  ComponentProps,
  ProgressChartComponent as ProgressChartSchema,
} from '@/quiz/engine/types';

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

interface Point {
  week: number;
  weight: number;
}

function easeInOut(t: number): number {
  // Smoothstep cosseno — curva suave em S do começo ao fim.
  return 0.5 - 0.5 * Math.cos(t * Math.PI);
}

function buildProjection(
  weight: number,
  weeks: number,
  target: number | null,
  weeklyDelta: number,
): Point[] {
  const points: Point[] = [];
  if (target !== null) {
    for (let w = 0; w <= weeks; w++) {
      const t = w / weeks;
      points.push({ week: w, weight: weight + (target - weight) * easeInOut(t) });
    }
    return points;
  }
  for (let w = 0; w <= weeks; w++) {
    const t = w / weeks;
    const totalDelta = weeklyDelta * weeks;
    points.push({ week: w, weight: weight + totalDelta * easeInOut(t) });
  }
  return points;
}

export function ProgressChart({
  config,
  context,
}: ComponentProps<ProgressChartSchema>): JSX.Element {
  const weight = readNumber(context.variables[config.weightVariable]);
  const target = config.targetVariable
    ? readNumber(context.variables[config.targetVariable])
    : null;
  const weeks = config.weeks ?? 12;
  const delta = config.weeklyDeltaKg ?? -0.5;

  const data = useMemo<Point[]>(() => {
    if (weight === null) return [];
    return buildProjection(weight, weeks, target, delta);
  }, [weight, weeks, target, delta]);

  if (weight === null || data.length === 0) {
    return (
      <div
        className={cn(
          'rounded-[var(--radius)] border border-quiz-muted bg-quiz-bg p-6 text-center text-base text-quiz-fg/60',
          config.className,
        )}
      >
        Preencha seu peso atual para ver a projeção.
      </div>
    );
  }

  const endWeight = data[data.length - 1].weight;
  const diff = endWeight - weight;
  const diffLabel =
    diff >= 0 ? `+${diff.toFixed(1)} kg` : `${diff.toFixed(1)} kg`;

  return (
    <div
      className={cn(
        'rounded-[var(--radius)] border border-quiz-muted bg-quiz-bg p-5',
        config.className,
      )}
    >
      {config.title && (
        <h3 className="mb-1 text-base font-semibold text-quiz-fg">
          {config.title}
        </h3>
      )}
      <p className="mb-4 text-base text-quiz-fg/70">
        Projeção de {weeks} semanas. Variação total: <strong className='text-quiz-accent'>{diffLabel}</strong>
      </p>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
          >
            <defs>
              <linearGradient id="pq-progress-fill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="hsl(var(--quiz-accent))"
                  stopOpacity={0.35}
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--quiz-accent))"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--quiz-fg) / 0.08)"
            />
            <XAxis
              dataKey="week"
              tickFormatter={(v: number) => `S${v}`}
              stroke="hsl(var(--quiz-fg) / 0.5)"
              fontSize={11}
            />
            <YAxis
              stroke="hsl(var(--quiz-fg) / 0.5)"
              fontSize={11}
              domain={['dataMin - 2', 'dataMax + 2']}
              tickFormatter={(v: number) => `${v.toFixed(0)}kg`}
              width={45}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Peso']}
              labelFormatter={(label: number) => `Semana ${label}`}
              contentStyle={{
                background: 'hsl(var(--quiz-bg))',
                border: '1px solid hsl(var(--quiz-muted))',
                borderRadius: 'calc(var(--radius) - 4px)',
                fontSize: 12,
              }}
            />
            <ReferenceLine
              y={weight}
              stroke="hsl(var(--quiz-fg) / 0.3)"
              strokeDasharray="4 4"
              label={{
                value: 'Hoje',
                fill: 'hsl(var(--quiz-fg) / 0.6)',
                fontSize: 10,
                position: 'insideTopLeft',
              }}
            />
            <Area
              type="monotone"
              dataKey="weight"
              stroke="hsl(var(--quiz-accent))"
              strokeWidth={2.5}
              fill="url(#pq-progress-fill)"
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
