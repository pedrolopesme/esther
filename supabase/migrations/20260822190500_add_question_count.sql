alter table public.exercise_lists
add column question_count integer generated always as (jsonb_array_length(exercises)) stored;
