export const promptedNoteDefinitions = [
  {
    promptType: 'highlight',
    label: 'Highlight:',
  },
  {
    promptType: 'lowlight',
    label: 'Lowlight:',
  },
  {
    promptType: 'quote_of_the_night',
    label: 'Best Quote:',
  },
  {
    promptType: 'funny_moment',
    label: 'Funniest Moment:',
  },
  {
    promptType: 'best_decision',
    label: 'Best Decision:',
  },
  {
    promptType: 'worst_decision',
    label: 'Worst Decision:',
  },
] as const;

export type PromptedNoteType = (typeof promptedNoteDefinitions)[number]['promptType'];

export type PromptedNoteAnswers = Record<PromptedNoteType, string>;

export const createEmptyPromptedNoteAnswers = (): PromptedNoteAnswers => {
  return Object.fromEntries(
    promptedNoteDefinitions.map((prompt) => [prompt.promptType, ''])
  ) as PromptedNoteAnswers;
};
