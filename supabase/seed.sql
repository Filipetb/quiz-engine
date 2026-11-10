-- Seed: registra os quizzes de exemplo para que a edge function track os encontre.
-- O schema_json real é carregado do arquivo; aqui só vai um placeholder mínimo.
insert into public.quizzes (slug, name, version, schema_json, status)
values
  (
    'treino-em-casa-es',
    'Treino em Casa — Calistenia (ES)',
    1,
    '{"quiz":{"id":"treino-em-casa-es","slug":"treino-em-casa-es","name":"Treino em Casa ES","version":1}}',
    'active'
  ),
  (
    'treino-em-casa-en',
    'Home Workout — Calisthenics (EN)',
    1,
    '{"quiz":{"id":"treino-em-casa-en","slug":"treino-em-casa-en","name":"Home Workout EN","version":1}}',
    'active'
  )
on conflict (slug) do nothing;
