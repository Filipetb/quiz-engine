import { create } from 'zustand';
import { supabase } from '@/shared/supabase/client';

const STORAGE_KEY = 'pq.dashboard.selected_quiz';

export interface QuizOption {
  id: string;
  slug: string;
  name: string;
}

interface QuizSelectorState {
  quizzes: QuizOption[];
  selectedSlug: string | null;
  loading: boolean;
  error: string | null;
  loadQuizzes: () => Promise<void>;
  setSlug: (slug: string) => void;
}

export const useQuizSelector = create<QuizSelectorState>((set, get) => ({
  quizzes: [],
  selectedSlug: null,
  loading: false,
  error: null,

  async loadQuizzes() {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('quizzes')
      .select('id, slug, name')
      .eq('status', 'active')
      .order('name');

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    const quizzes = (data ?? []) as QuizOption[];
    const persisted =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(STORAGE_KEY)
        : null;
    const current = get().selectedSlug ?? persisted;
    const valid = quizzes.find((q) => q.slug === current);
    const selectedSlug = valid?.slug ?? quizzes[0]?.slug ?? null;

    set({ quizzes, selectedSlug, loading: false });
  },

  setSlug(slug: string) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, slug);
    }
    set({ selectedSlug: slug });
  },
}));
