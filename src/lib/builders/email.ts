import { EmailPromptInput } from './schemas';

const SHIELD_ENABLED_PRESETS = ['universal', 'executive', 'articulator', 'authentic', 'diplomat', 'engineer', 'caretaker', 'closer', 'storyteller'];
const SHIELD_DISABLED_PRESETS = ['academic', 'shield', 'grammar_police'];

const BANNED_PHRASES = [
  'delve', 'tapestry', 'foster', 'unleash', 
  'transformative', 'landscape', 'testament',
  'game-changer', 'Please do not hesitate to reach out',
  'I hope this email finds you well'
];

const PRESET_INSTRUCTIONS: Record<string, string> = {
  universal: "Write in a standard, clear professional tone. No slang, no complex jargon. Just plain English.",
  grammar_police: "Your ONLY task is to fix grammar, spelling, and punctuation errors. Do NOT change the tone, vocabulary, sentence structure, or length.",
  authentic: "Refine the flow and clarity of the text. Remove sentence fragments and awkward phrasing, but strictly preserve the user's original attitude and vocabulary.",
  articulator: "Optimize for internal team communication. Use casual language, standard abbreviations, and minimize fluff. Lowercase typing is acceptable.",
  executive: "Prioritize brevity. Remove adjectives. Focus on action items. No pleasantries.",
  diplomat: "Focus on de-escalation and validation. Use passive voice to soften blows. Validate feelings.",
  engineer: "Focus on facts and data. Use bullet points. Remove emotional language. Be precise.",
  caretaker: "Adopt a patient, empathetic customer service tone. Apologize for issues, validate frustration, and pivot to solutions.",
  closer: "Use persuasive sales copywriting techniques. Focus on benefits over features. Create urgency. End with a strong Call to Action.",
  academic: "Elevate vocabulary to a collegiate/PhD level. Use complex sentence structures. Avoid contractions. Be authoritative.",
  shield: "Write defensively from a legal perspective. Be precise but non-committal. Avoid admitting absolute fault.",
  storyteller: "Use a narrative structure. Start with a hook. Use sensory language to paint a picture. Focus on the emotional journey."
};

const FIDELITY_INSTRUCTIONS: Record<string, string> = {
  polisher: 'Do not change intent. Only fix grammar, clarity, and flow.',
  expander: 'Convert fragments into cohesive prose while staying concise.',
  reducer: 'Summarize to essentials. Remove filler and pleasantries.',
  transmuter: 'Rewrite entirely to match the target persona while keeping factual intent.'
};

function getWarmthInstruction(warmth: number): string {
  const w = Math.round(warmth * 100);
  if (w <= 20) return "Ice Cold, Direct, No pleasantries.";
  if (w >= 80) return "High Empathy, Warm, Conversational.";
  // Default middle range
  if (w <= 40) return 'Tone should stay straightforward with minimal empathy.';
  if (w <= 60) return 'Tone should remain neutral-professional with polite acknowledgement.';
  return 'Tone should add polite warmth and conversational phrasing while staying concise.';
}

function getProfessionalismInstruction(prof: number): string {
  const p = Math.round(prof * 100);
  if (p <= 20) return "Casual, Slack-style, Lowercase okay.";
  if (p >= 80) return "Formal, Corporate, Standard Grammar.";
  // Default middle range
  if (p <= 50) return 'Business casual: contractions ok, keep the language modern and clear.';
  return 'Formal business tone: complete sentences, avoid slang.';
}

export function buildShieldConstraints(preset: string): string {
  // If the preset is academic or shield, DISABLE constraints (return empty string)
  if (SHIELD_DISABLED_PRESETS.includes(preset)) return '';

  return `
CRITICAL CONSTRAINTS:
- NEVER use the em-dash character (—). Use commas or periods instead.
- FORBIDDEN words: ${BANNED_PHRASES.join(', ')}
`.trim();
}

export function buildEmailPrompt(input: EmailPromptInput): string {
  const presetId = input.preset;
  const presetInstruction = PRESET_INSTRUCTIONS[presetId] || "Standard professional tone.";
  const shieldBlock = buildShieldConstraints(presetId);
  
  const warmthInst = getWarmthInstruction(input.warmth);
  const profInst = getProfessionalismInstruction(input.professionalism);
  const fidelityInst = FIDELITY_INSTRUCTIONS[input.fidelity] || FIDELITY_INSTRUCTIONS.expander;
  
  const goalBlock = input.goal ? `\n[GOAL]\n${input.goal}` : '';
  const bioBlock = (presetId === 'ghost' && input.bioSample) ? `\n[BIO SAMPLE]\n"${input.bioSample}"` : '';

  return `[ROLE]
You are a professional communication specialist operating in the "${presetId}" persona.
Your mission: compile the user’s rough draft into a finalized message strictly following the instructions below.

[PARAMETERS]
- Warmth: ${warmthInst}
- Professionalism: ${profInst}
- Fidelity Mode: ${fidelityInst}
- Length Preference: ${input.length || 'Medium'}
${shieldBlock ? '- ' + shieldBlock.replace(/\n/g, '\n- ') : ''}

[VOICE GUIDANCE]
Persona directives: ${presetInstruction}

[INPUT DRAFT]
"${input.rawInput.trim()}"${goalBlock}${bioBlock}

[OUTPUT REQUIREMENTS]
1. Preserve factual intent from the input.
2. Apply the slider instructions literally.
3. Do not add information not found in the draft.
4. Reply with the final email only. No commentary about these rules.`;
}


