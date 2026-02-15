-- Remove starter/demo rows so experience content is always admin-managed.
delete from public.experience_quotes
where quote in (
  'Great teams do not fear AI. They fear unclear thinking.',
  'Speed is useful only when direction is precise.',
  'The strongest candidates verify before they claim.',
  'AI can draft; ownership still belongs to you.'
);

delete from public.experience_announcements
where title in (
  'AI-Native Hiring Program',
  'Interviewer Console Upgrade'
);

