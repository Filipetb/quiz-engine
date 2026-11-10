import { Button } from '@/shared/ui/button';
import type { DateFilterState, Preset } from '@/dashboard/hooks/useDateFilter';

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7d', label: '7 dias' },
  { value: 'custom', label: 'Custom' },
];

export function DateFilter({
  filter,
}: {
  filter: DateFilterState;
}): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-md border">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => filter.setPreset(p.value)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors first:rounded-l-md last:rounded-r-md ${
              filter.preset === p.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-foreground hover:bg-accent'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {filter.preset === 'custom' && (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={filter.dateFrom}
            onChange={(e) =>
              filter.setCustomRange(e.target.value, filter.dateTo)
            }
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          />
          <span className="text-sm text-muted-foreground">a</span>
          <input
            type="date"
            value={filter.dateTo}
            onChange={(e) =>
              filter.setCustomRange(filter.dateFrom, e.target.value)
            }
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          />
        </div>
      )}

      <Button
        variant={filter.compare ? 'default' : 'outline'}
        size="sm"
        onClick={() => filter.setCompare(!filter.compare)}
      >
        Comparar
      </Button>
    </div>
  );
}
