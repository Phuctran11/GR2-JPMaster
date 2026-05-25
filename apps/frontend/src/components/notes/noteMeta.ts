import type { LessonNoteType } from '../../services/api';

export const noteTypeOptions: Array<{ value: LessonNoteType | 'all'; label: string }> = [
  { value: 'all', label: 'All types' },
  { value: 'text_note', label: 'Text notes' },
  { value: 'video_note', label: 'Video notes' },
  { value: 'highlight', label: 'Highlights' },
  { value: 'question_note', label: 'Question notes' },
  { value: 'ai_summary', label: 'AI summaries' },
];

export const noteTypeMeta: Record<LessonNoteType, { label: string; icon: string; className: string }> = {
  text_note: { label: 'Text', icon: 'notes', className: 'border-blue-200 bg-blue-50 text-blue-800' },
  video_note: { label: 'Video', icon: 'movie', className: 'border-rose-200 bg-rose-50 text-rose-800' },
  highlight: { label: 'Highlight', icon: 'stylus_note', className: 'border-yellow-300 bg-yellow-100 text-yellow-950' },
  question_note: { label: 'Question', icon: 'quiz', className: 'border-violet-200 bg-violet-50 text-violet-800' },
  ai_summary: { label: 'AI', icon: 'auto_awesome', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
};
