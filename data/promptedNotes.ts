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
  {
    promptType: 'side_quest',
    label: 'Side Quest:',
  },
  {
    promptType: 'plot_twist',
    label: 'Plot Twist:',
  },
  {
    promptType: 'main_character_moment',
    label: 'Main Character Moment:',
  },
  {
    promptType: 'security_footage_moment',
    label: 'Moment That Needs Security Footage:',
  },
  {
    promptType: 'needed_context',
    label: 'Needs Too Much Context:',
  },
  {
    promptType: 'temporary_lore',
    label: 'Temporary Lore We Invented:',
  },
  {
    promptType: 'group_delusion',
    label: 'Group Delusion:',
  },
  {
    promptType: 'side_eye_moment',
    label: 'Side-Eye Moment:',
  },
  {
    promptType: 'surprisingly_wholesome',
    label: 'Surprisingly Wholesome:',
  },
  {
    promptType: 'tiny_victory',
    label: 'Tiny Victory:',
  },
  {
    promptType: 'emotional_damage',
    label: 'Emotional Damage:',
  },
  {
    promptType: 'unofficial_theme_song',
    label: 'Unofficial Theme Song:',
  },
  {
    promptType: 'person_who_carried',
    label: 'Who Carried The Night:',
  },
  {
    promptType: 'npc_of_the_night',
    label: 'NPC Of The Night:',
  },
  {
    promptType: 'lost_and_found',
    label: 'Lost And Found:',
  },
  {
    promptType: 'alternate_title',
    label: 'Alternate Title:',
  },
] as const;

export type PromptedNoteType = (typeof promptedNoteDefinitions)[number]['promptType'];

export type PromptedNoteAnswers = Record<PromptedNoteType, string>;

export const createEmptyPromptedNoteAnswers = (): PromptedNoteAnswers => {
  return Object.fromEntries(
    promptedNoteDefinitions.map((prompt) => [prompt.promptType, ''])
  ) as PromptedNoteAnswers;
};
