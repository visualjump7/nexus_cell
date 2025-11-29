import { z } from 'zod';

// Aspect Ratio Schema
export const AspectRatioSchema = z.enum(['16:9', '9:16', '1:1', '21:9', '4:3', '3:4']);
export type AspectRatio = z.infer<typeof AspectRatioSchema>;

// Camera Configuration Schema
export const CameraConfigSchema = z.object({
  angle: z.string().optional().nullable(),
  movement: z.string().optional().nullable(),
  lens: z.string().optional().nullable(),
});
export type CameraConfig = z.infer<typeof CameraConfigSchema>;

// Visual Prompt Input Schema (Base for Image/Video)
export const VisualPromptInputSchema = z.object({
  subject: z.string(),
  action: z.string().optional().nullable(),
  environment: z.string().optional().nullable(),
  lighting: z.string().optional().nullable(),
  filmStock: z.string().optional().nullable(),
  style: z.string().optional().nullable(),
  camera: CameraConfigSchema.optional(),
  aspectRatio: AspectRatioSchema.optional().default('16:9'),
  negativePrompt: z.string().optional(),
});
export type VisualPromptInput = z.infer<typeof VisualPromptInputSchema>;

// Video Prompt Input Schema (Extends Visual)
export const VideoPromptInputSchema = VisualPromptInputSchema.extend({
  subjectAction: z.string().optional().nullable(),
  cameraMovement: z.string().optional().nullable(),
});
export type VideoPromptInput = z.infer<typeof VideoPromptInputSchema>;

// Email Prompt Input Schema
export const EmailPromptInputSchema = z.object({
  rawInput: z.string(),
  goal: z.string().optional(),
  preset: z.string(),
  warmth: z.number().min(0).max(1),
  professionalism: z.number().min(0).max(1),
  fidelity: z.enum(['polisher', 'expander', 'reducer', 'transmuter']),
  length: z.string().optional(),
  bioSample: z.string().optional(),
  platform: z.enum(['email', 'slack', 'linkedin', 'tweet']).optional(),
  structure: z.enum(['Paragraphs', 'Bulleted List']).optional(),
});
export type EmailPromptInput = z.infer<typeof EmailPromptInputSchema>;
