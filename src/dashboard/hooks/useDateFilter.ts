import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const TZ = 'America/Sao_Paulo';

function todaySP(): string {
  return format(toZonedTime(new Date(), TZ), 'yyyy-MM-dd');
}

function yesterdaySP(): string {
  return format(subDays(toZonedTime(new Date(), TZ), 1), 'yyyy-MM-dd');
}

function daysAgoSP(n: number): string {
  return format(subDays(toZonedTime(new Date(), TZ), n), 'yyyy-MM-dd');
}

export type Preset = 'today' | 'yesterday' | '7d' | 'custom';

export interface DateFilterState {
  preset: Preset;
  dateFrom: string;
  dateTo: string;
  compare: boolean;
  setPreset: (p: Preset) => void;
  setCustomRange: (from: string, to: string) => void;
  setCompare: (c: boolean) => void;
}

export function useDateFilter(): DateFilterState {
  const [preset, setPresetRaw] = useState<Preset>('7d');
  const [customFrom, setCustomFrom] = useState(daysAgoSP(6));
  const [customTo, setCustomTo] = useState(todaySP());
  const [compare, setCompare] = useState(false);

  function setPreset(p: Preset) {
    setPresetRaw(p);
  }

  function setCustomRange(from: string, to: string) {
    setCustomFrom(from);
    setCustomTo(to);
    setPresetRaw('custom');
  }

  let dateFrom: string;
  let dateTo: string;

  switch (preset) {
    case 'today':
      dateFrom = todaySP();
      dateTo = todaySP();
      break;
    case 'yesterday':
      dateFrom = yesterdaySP();
      dateTo = yesterdaySP();
      break;
    case '7d':
      dateFrom = daysAgoSP(6);
      dateTo = todaySP();
      break;
    case 'custom':
      dateFrom = customFrom;
      dateTo = customTo;
      break;
  }

  return { preset, dateFrom, dateTo, compare, setPreset, setCustomRange, setCompare };
}
