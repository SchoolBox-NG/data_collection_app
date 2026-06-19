export const CONTENT_TYPES = [
  "concept_explanation",
  "worked_example",
  "practice_question",
  "solution_step",
  "feedback_message",
  "hint",
  "classroom_instruction",
  "assessment_question",
] as const;

export const DIFFICULTY_LEVELS = ["easy", "medium", "hard"] as const;

export const TARGET_STYLES = [
  "standard_igbo",
  "code_mixed_igbo_english",
  "child_friendly_igbo",
] as const;

export const TARGET_LANGUAGES = [
  { label: "Igbo", value: "ibo_Latn" },
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];
export type TargetStyle = (typeof TARGET_STYLES)[number];

export function isContentType(value: string): value is ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(value);
}

export function isDifficultyLevel(value: string): value is DifficultyLevel {
  return (DIFFICULTY_LEVELS as readonly string[]).includes(value);
}

export function isTargetStyle(value: string): value is TargetStyle {
  return (TARGET_STYLES as readonly string[]).includes(value);
}
