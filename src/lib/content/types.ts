import {
  type ContentType,
  type DifficultyLevel,
  type TargetStyle,
} from "./constants";
import {
  type GlossaryTermUsage,
  type StoredGlossaryTermUsage,
} from "./glossary";

export type ContentImportInput = {
  grade: string;
  subject: string;
  topic: string;
  subtopic?: string;
  content_type: ContentType | string;
  difficulty?: DifficultyLevel | string;
  curriculum_source?: string;
  target_language?: string;
  target_style: TargetStyle | string;
  original_english: string;
  simplified_english: string;
};

export type MathReviewStatus = "pending" | "approved" | "rejected" | "needs_fix";

export type MathPlaceholderKind = "full" | "component";

export type MathItem = {
  placeholder: string;
  latex: string;
  value?: string | number;
  spoken_english: string;
  spoken_igbo: string;
  position: number;
  review_status: MathReviewStatus;
  replacement_found: boolean;
  kind: MathPlaceholderKind;
  family: string;
  role?: string;
  component_of?: string;
};

export type MathMapEntry = {
  latex?: string;
  value?: string | number;
  spoken_en: string;
  spoken_english: string;
  spoken_igbo: string;
  review_status: MathReviewStatus;
  kind: MathPlaceholderKind;
  family: string;
  role?: string;
  component_of?: string;
};

export type ContentPreview = {
  input: ContentImportInput;
  source_text_for_model: string;
  has_math: boolean;
  math_items: MathItem[];
  math_map: Record<string, MathMapEntry>;
  glossary_terms_used: string[];
  glossary_terms: GlossaryTermUsage[];
  glossary_terms_for_storage: StoredGlossaryTermUsage[];
  warnings: string[];
};

export type ImportError = {
  row: number;
  message: string;
};

export type ImportResult = {
  created: Array<{
    id: string;
    record_id: string;
    source_text_for_model: string;
    has_math: boolean;
    math_items: MathItem[];
    glossary_terms_used: string[];
    glossary_terms: StoredGlossaryTermUsage[];
  }>;
  errors: ImportError[];
};
