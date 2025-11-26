// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT ARMORY — Type Definitions
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────────
// PLATFORM TYPES
// ─────────────────────────────────────────────────────────────────────────────────

export type PlatformId =
  | 'midjourney'
  | 'dalle'
  | 'ideogram'
  | 'leonardo'
  | 'stable'
  | 'grok'
  | 'runway'
  | 'veo'
  | 'sora'
  | 'pika'
  | 'kling';

export type MediaType = 'image' | 'video';

export type PlatformType = 'image' | 'video';

export interface Platform {
  id: PlatformId;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  type: PlatformType;
  description: string;
}

// ─────────────────────────────────────────────────────────────────────────────────
// PROMPT STATE (The DNA)
// ─────────────────────────────────────────────────────────────────────────────────

export interface PromptState {
  subject: string;
  angle: string | null;
  movement: string | null;
  lens: string | null;
  lighting: string | null;
  style: string | null;
  filmStock: string | null;
  aspectRatio: '16:9' | '9:16' | '1:1' | '21:9';
}

export const defaultPromptState: PromptState = {
  subject: '',
  angle: null,
  movement: null,
  lens: null,
  lighting: null,
  style: null,
  filmStock: null,
  aspectRatio: '16:9',
};

// ─────────────────────────────────────────────────────────────────────────────────
// ARSENAL TYPES
// ─────────────────────────────────────────────────────────────────────────────────

export type CardCategory = 'angle' | 'movement' | 'lens' | 'lighting' | 'style' | 'filmStock';

export interface ArsenalCard {
  id: string;
  label: string;
  value: string;
  desc: string;
  icon?: string;
  isCustom?: boolean;
}

export interface ArsenalCategory {
  label: string;
  icon: string;
  stateKey: keyof PromptState;
  cards: ArsenalCard[];
}

export type Arsenal = Record<string, ArsenalCategory>;

// ─────────────────────────────────────────────────────────────────────────────────
// PRESET TYPES
// ─────────────────────────────────────────────────────────────────────────────────

export interface Preset {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  config: Partial<PromptState>;
  isCustom?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────────
// DATABASE TYPES (Supabase)
// ─────────────────────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'pro' | 'team' | 'enterprise';
  subscription_status: 'active' | 'past_due' | 'canceled' | 'trialing';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  generations_this_month: number;
  generations_reset_at: string | null;
  default_platform: string;
  default_aspect_ratio: string;
  theme: string;
  created_at: string;
  updated_at: string;
  last_seen_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface Prompt {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  subject: string | null;
  angle: string | null;
  movement: string | null;
  lens: string | null;
  lighting: string | null;
  style: string | null;
  film_stock: string | null;
  aspect_ratio: string;
  generated_prompts: Record<PlatformId, string>;
  folder_id: string | null;
  tags: string[];
  is_favorite: boolean;
  is_archived: boolean;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  folder?: Folder | null;
}

export interface Generation {
  id: string;
  user_id: string;
  prompt_id: string | null;
  platform: PlatformId;
  prompt_text: string;
  prompt_state: PromptState | null;
  aspect_ratio: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  media_type: MediaType | null;
  media_url: string | null;
  thumbnail_url: string | null;
  storage_path: string | null;
  api_response: Record<string, any> | null;
  revised_prompt: string | null;
  cost_credits: number | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
  completed_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
}

export interface Note {
  id: string;
  user_id: string;
  prompt_id: string | null;
  generation_id: string | null;
  title: string | null;
  content: string;
  content_type: 'plain' | 'markdown' | 'html';
  tags: string[];
  is_pinned: boolean;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomCard {
  id: string;
  user_id: string;
  category: CardCategory;
  label: string;
  value: string;
  description: string | null;
  icon: string | null;
  platform_values: Record<PlatformId, string>;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreset {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  config: Partial<PromptState>;
  category: string | null;
  is_favorite: boolean;
  sort_order: number;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number | null;
  price_yearly: number | null;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  generations_per_month: number;
  custom_cards_limit: number;
  presets_limit: number;
  prompts_limit: number;
  storage_gb: number;
  features: {
    api_access: boolean;
    priority_queue: boolean;
    byok: boolean;
    team_sharing: boolean;
    sso?: boolean;
    custom_integrations?: boolean;
  };
  is_active: boolean;
  sort_order: number;
}

// ─────────────────────────────────────────────────────────────────────────────────
// API TYPES
// ─────────────────────────────────────────────────────────────────────────────────

export interface GenerateRequest {
  platform: PlatformId;
  prompt: string;
  aspectRatio: string;
  promptState?: PromptState;
  options?: Record<string, any>;
}

export interface GenerateResponse {
  success: boolean;
  mediaUrl?: string;
  thumbnailUrl?: string;
  revisedPrompt?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// ─────────────────────────────────────────────────────────────────────────────────
// INPUT TYPES (for creating/updating)
// ─────────────────────────────────────────────────────────────────────────────────

export type CreatePromptInput = Omit<Prompt, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'use_count' | 'last_used_at' | 'folder'>;

export type UpdatePromptInput = Partial<CreatePromptInput>;

export type CreateNoteInput = Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export type UpdateNoteInput = Partial<CreateNoteInput>;

export type CreateCustomCardInput = Omit<CustomCard, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export type UpdateCustomCardInput = Partial<CreateCustomCardInput>;

export type CreateUserPresetInput = Omit<UserPreset, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'use_count' | 'last_used_at'>;

export type UpdateUserPresetInput = Partial<CreateUserPresetInput>;

export type CreateFolderInput = Omit<Folder, 'id' | 'user_id' | 'created_at'>;

export type UpdateFolderInput = Partial<CreateFolderInput>;
