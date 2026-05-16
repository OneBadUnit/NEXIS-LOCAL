// ============================================================
// ARC-NEXUS - CLIENT-SIDE PROMPT BUILDERS
// File: src/lib/prompts.js
//
// Mirrors the prompt logic in:
//   backend/app/reconstruction.py  (buildReconstructionPrompt)
//   backend/app/creation.py        (buildCreationPrompt)
//
// Used only in LOCAL MODEL MODE when the browser calls Ollama
// directly. The hosted backend path does NOT use this file.
// ============================================================


// ------------------------------------------------------------
// RECONSTRUCTION PROMPTS
// Mirrors: reconstruction.py → build_prompt → transform_prompt
// Called for: Summary Package, Creator Package
// ------------------------------------------------------------

// ------------------------------------------------------------
// FRONTEND FALLBACK COPY — SUMMARY PACKAGE RULES
// Client-side mirror of backend/app/prompts/summary_package_rules.txt.
// Used ONLY when modelConfig.type === "local" (bridge/Ollama mode).
// MUST be kept in sync with backend/app/prompts/summary_package_rules.txt.
// ------------------------------------------------------------
const SUMMARY_PACKAGE_RULES = `SUMMARY PACKAGE RULES

When multiple raw inputs are selected, combine them into ONE unified Summary Package unless the user explicitly requests separate summaries per source.

Do not generate one summary package per raw input.

Use all selected sources together as context.

The Summary Package must prioritize:
- factual fidelity
- clarity
- chronology
- neutrality
- source-grounded reporting

Do not optimize for engagement, virality, or dramatic tone.

Required sections:

1. Outline
- Create ONE unified outline using all selected sources.
- Organize information logically and chronologically when possible.
- Preserve nuance and uncertainty where relevant.
- Do not duplicate sections per source.

2. Timeline
- Create ONE combined timeline of events.
- Order events chronologically as accurately as possible.
- Avoid repeating the same event from multiple sources unless new details are added.
- If sources disagree on timing or dates, clearly identify the discrepancy.

3. Key Points
- Produce a concise combined list of the most important facts, claims, statements, and developments.
- Avoid duplicate points.
- Distinguish between:
  - confirmed facts
  - claims/allegations
  - opinions
  - legal interpretations

4. Summary
- Write ONE unified summary using all selected sources.
- Keep tone neutral and informational.
- Preserve important context and uncertainty.
- Clearly separate:
  - what happened
  - what is alleged
  - what experts/opinions claim
- Do not insert unsupported conclusions or speculation.

Important Rules:
- Multi-selected raws mean the user wants synthesis.
- Combine selected raws into a single coherent package.
- Do not create separate outputs for each source unless explicitly requested.
- If sources conflict, identify the conflict instead of choosing one version silently.
- Do not invent dialogue, motivations, or legal conclusions.
- Do not exaggerate or sensationalize.
- Preserve source attribution when helpful.

Conflicting Source Handling:
If multiple sources disagree:
- identify the disagreement clearly
- avoid presenting uncertain information as settled fact
- use wording such as:
  - "One source reported..."
  - "Another report stated..."
  - "The sources differed on..."

Formatting:
- Keep sections clearly separated.
- Avoid repetitive wording.
- Avoid AI-style filler language.
- Avoid unnecessary repetition of names/titles.`;

// ------------------------------------------------------------
// FRONTEND FALLBACK COPY — CREATOR PACKAGE RULES
// Client-side mirror of backend/app/prompts/creator_package_rules.txt.
// Used ONLY when modelConfig.type === "local" (bridge/Ollama mode).
// MUST be kept in sync with backend/app/prompts/creator_package_rules.txt.
// ------------------------------------------------------------
const CREATOR_PACKAGE_RULES = `CREATOR PACKAGE RULES

When multiple raw inputs are selected, combine them into ONE unified creator package unless the user explicitly asks for separate outputs per source.

Do not generate one package per raw input.

Do not invent dates, years, or timestamps.

If a source does not provide a date:
- omit the date
- or use relative phrasing such as:
  - "Later"
  - "After the arrest"
  - "Following the incident"

If sources contain conflicting dates, names, or factual claims:
- explicitly identify the conflict
- do not silently choose one version
- do not place conflicting information in separate sections without explanation

Never fabricate years or chronology markers.

Use all selected sources together as context.

The Creator Package must produce usable creator assets, not just summaries or quote fragments.

Required sections:

1. Make Engaging
- Rewrite the combined source material into a clear, engaging narrative.
- Preserve factual accuracy.
- Do not add claims, motives, facts, or legal conclusions not supported by the sources.

2. Short Video Script
- Create a complete 30–60 second spoken video script.
- Must include:
  - Hook
  - Context
  - Conflict/tension
  - Key facts
  - Closing line or CTA
- Write in natural spoken language.
- Do not output disconnected quote fragments.
- Do not invent dialogue.

3. Hook Options
- Provide 3 short opening hooks only.
- Hooks must be grounded in the source.
- Avoid exaggerated or legally overconfident claims.

4. Quote Pulls
- Extract memorable direct quotes from the sources.
- Do not rewrite quotes unless clearly labeled as paraphrase.

5. Title Suggestions
- Provide 5 title options.
- Titles should be clear, clickable, and fact-grounded.

6. Keywords
- Provide relevant keywords from the combined topic.

Important:
- "Script" means a usable spoken narration script with flow.
- "Hook" means only the opening line.
- "Quote Pulls" means extracted source lines.
- Do not confuse these sections.`;


function transformPrompt(text, option) {
  // Prepend synthesis rules to Summary Package prompts.
  // Mirrors reconstruction.py → transform_prompt → _rules_block.
  const _rulesPreamble = SUMMARY_PACKAGE_RULES ? `${SUMMARY_PACKAGE_RULES}\n\n` : "";
  // Prepend creator rules to Creator Package prompts.
  // Mirrors reconstruction.py → transform_prompt → _creator_block.
  const _creatorPreamble = CREATOR_PACKAGE_RULES ? `${CREATOR_PACKAGE_RULES}\n\n` : "";

  if (option === "Outline") {
    return `${_rulesPreamble}SOURCE TEXT:
${text}

TASK:
Create a structured outline of the source material.

CRITICAL:
- Do NOT summarize or compress
- Do NOT describe the source
- Do NOT add information not in the source
- Use only content that is present in the source

RETURN ONLY:

Title:
<clear title derived from source>

I. <main section or topic>
   A. <supporting detail>
   B. <supporting detail>

II. <main section or topic>
   A. <supporting detail>
   B. <supporting detail>

III. <main section or topic>
   A. <supporting detail>
   B. <supporting detail>
`;
  }

  if (option === "Timeline") {
    return `${_rulesPreamble}SOURCE TEXT:
${text}

TASK:
Extract a chronological timeline of events from the source.

FORMAT:
<date or period> — <event>
<date or period> — <event>

RULES:
- Use only what is stated in the source
- Do NOT infer or add events
- Order chronologically
- If no dates are present, use relative markers (e.g. "Before X", "After Y")
`;
  }

  if (option === "Key Points") {
    return `${_rulesPreamble}SOURCE TEXT:
${text}

TASK:
Extract the key points as a numbered list.

RULES:
- Each point must be a complete, standalone sentence
- Use only content from the source
- Do NOT add commentary or explanation
- Do NOT infer or summarize beyond what is stated
`;
  }

  if (option === "Summary") {
    return `${_rulesPreamble}SOURCE TEXT:
${text}

TASK:
Write a structured summary of the source material.

STRICT OUTPUT RULES:
- Use ONLY content present in the source — do NOT add outside knowledge
- Do NOT infer, speculate, or assume anything not stated
- Do NOT include opinions, recommendations, or analysis
- Keep tone strictly neutral and factual
- Remove repetition and filler
- Combine overlapping or repeated information into single, information-dense sentences
- Preserve important names, numbers, dates, and specifics whenever present
- Write in full sentences — do NOT use bullet points
- Do NOT create a conclusion section
- Do NOT describe the document, source, or structure (e.g., "the source covers", "this document explains")
- Write as if directly stating the events or information itself

RETURN ONLY:

Topic:
<one sentence stating what this source is about, using only source content>

Coverage:
<2–3 sentences describing what the source covers, in the order it appears>

Key Information:
<a tightly written set of sentences that preserves the most important information while minimizing redundancy; prioritize information density over brevity>
`;
  }

  if (option === "Make Engaging") {
    return `${_creatorPreamble}SOURCE TEXT:
${text}

TASK:
Rewrite the combined source material into a clear, engaging narrative.

RULES:
- Preserve factual accuracy
- Add natural, active tone
- Improve sentence rhythm and variety
- Do NOT invent claims, motives, facts, or legal conclusions not in the sources
- Do NOT change meaning
- Do NOT summarize aggressively

OUTPUT:
Return rewritten narrative only.
`;
  }

  if (option === "Short Video Script") {
    return `${_creatorPreamble}SOURCE TEXT:
${text}

TASK:
Write a complete 30–60 second spoken video script using the source material.

The script must follow this structure:
- Hook: one or two attention-grabbing opening lines
- Context: who, what, where — set the scene briefly
- Conflict or tension: the central issue, event, or stakes
- Key facts: the most important details from the source
- Closing line or CTA: a direct, punchy conclusion or call to action

STRICT RULES:
- Write in natural spoken language — do NOT write for print
- Do NOT output disconnected quote fragments
- Do NOT invent dialogue
- Do NOT invent dates, timestamps, or events not in the source
- If sources conflict on facts, identify the conflict — do NOT silently pick one version
- Do NOT use academic or formal tone

RETURN ONLY:

HOOK:
<one or two opening lines>

CONTEXT:
<brief scene-setting>

CONFLICT/TENSION:
<central issue or stakes>

KEY FACTS:
<fact line>
<fact line>
<fact line>

CLOSING:
<closing line or CTA>
`;
  }

  if (option === "Hook Options") {
    return `${_creatorPreamble}SOURCE TEXT:
${text}

TASK:
Write 3 short opening hook lines for a creator video.

RULES:
- Each hook must be grounded in the source material
- Do NOT invent claims or facts not present in the source
- Use tension, stakes, surprise, or urgency from the source
- Write each hook as a single spoken sentence or short pair of lines
- Do NOT fabricate dates or events not in the source

RETURN ONLY:

1. <hook>
2. <hook>
3. <hook>
`;
  }

  if (option === "Quote Pulls") {
    return `${_creatorPreamble}SOURCE TEXT:
${text}

TASK:
Extract direct quote pulls from the source material.

RULES:
- Use only text that appears verbatim or near-verbatim in the source
- If the source does not contain direct quotes, pull the most quotable lines
- Do NOT invent or paraphrase into quotes without clearly labeling the paraphrase
- Do NOT add commentary or explanation

RETURN ONLY:

Quote 1:
"<quote from source>"

Quote 2:
"<quote from source>"

Quote 3:
"<quote from source>"

Quote 4:
"<quote from source>"
`;
  }

  if (option === "Title Suggestions") {
    return `${_creatorPreamble}SOURCE TEXT:
${text}

TASK:
Generate 5 concise, attention-grabbing title options based strictly on the source content.

RULES:
- Each title must be grounded in the source material
- Do NOT invent angles or claims not present in the source
- No clickbait, no speculation
- Vary the style across the 5 options

RETURN ONLY:

1. <title option>
2. <title option>
3. <title option>
4. <title option>
5. <title option>
`;
  }

  if (option === "Keywords") {
    return `${_creatorPreamble}SOURCE TEXT:
${text}

TASK:
Extract the most relevant keywords and key phrases from the source.

RULES:
- Use only terms present in or directly stated by the source
- Do NOT invent or infer keywords
- Include both single words and short phrases where relevant
- Order by relevance (most important first)

RETURN ONLY:

Keywords:
<keyword>, <keyword>, <keyword>, <keyword>, <keyword>, <keyword>, <keyword>, <keyword>, <keyword>, <keyword>
`;
  }

  throw new Error(`No local prompt for option: ${option}`);
}


/**
 * Build a prompt for a reconstruction/convert request.
 * Mirrors reconstruction.py → build_prompt.
 *
 * @param {string} text    - source text
 * @param {string} preset  - "summary" | "creator" | "explained" | "analysis"
 * @param {string} action  - "transform" | "summarize" | "extract"
 * @param {string} option  - the specific option string
 * @returns {string} prompt
 */
export function buildReconstructionPrompt(text, preset, action, option) {
  if (action === "transform") {
    return transformPrompt(text, option);
  }

  if (action === "summarize") {
    if (option === "Short") {
      return `SOURCE TEXT:
${text}

TASK:
Write a 2–3 sentence summary.

RULES:
- Preserve all key facts
- No bullets, no headings
- Do NOT add information not in the source
`;
    }
    if (option === "Medium") {
      return `SOURCE TEXT:
${text}

TASK:
Write a 2-paragraph summary.

RULES:
- First paragraph: main idea and context
- Second paragraph: supporting detail and outcome
- No bullets, no headings
- Do NOT add information not in the source
`;
    }
    if (option === "Long") {
      return `SOURCE TEXT:
${text}

TASK:
Write a structured detailed summary.

RETURN ONLY:

Overview:
<1 paragraph covering the main idea>

Key Points:
- <key point>
- <key point>
- <key point>

Notable Details:
- <important detail>
- <important detail>

Conclusion:
<1–2 sentences>

RULES:
- Use only source content
- Do NOT add information not in the source
`;
    }
    throw new Error(`Invalid summarize option: ${option}`);
  }

  if (action === "extract") {
    if (option === "Key Points") {
      return `SOURCE TEXT:
${text}

TASK:
Extract the key points as a numbered list.

RULES:
- Each point must be a complete, standalone sentence
- Use only content from the source
- No commentary, no added explanation
`;
    }
    if (option === "Quotes") {
      return `SOURCE TEXT:
${text}

TASK:
Extract direct quotes only.

RULES:
- Format each quote as: "<quote>"
- Do NOT paraphrase
- Do NOT add commentary
- Only include text that appears verbatim in the source
`;
    }
    if (option === "Entities") {
      return `SOURCE TEXT:
${text}

TASK:
Extract all named entities from the source.

RETURN ONLY:

People:
- <name> — <role or context>

Places:
- <name> — <context>

Organizations:
- <name> — <context>

RULES:
- Skip any category with no entries
- Use only what is stated in the source
`;
    }
    if (option === "Timeline") {
      return `SOURCE TEXT:
${text}

TASK:
Extract a chronological timeline of events.

FORMAT:
<date or period> — <event>
<date or period> — <event>

RULES:
- Use only what is stated in the source
- Do NOT infer or add events
- Order chronologically
`;
    }
    throw new Error(`Invalid extract option: ${option}`);
  }

  throw new Error(`Invalid action: ${action}`);
}


// ------------------------------------------------------------
// CREATION PROMPTS
// Mirrors: creation.py → build_prompt
// Called for: Refine mode
// ------------------------------------------------------------

/**
 * Build a prompt for a creation/refine request.
 * Mirrors creation.py → build_prompt.
 *
 * @param {string} text   - source text
 * @param {string} mode   - "refine" | "format" | "argument"
 * @param {string} option - instruction string (for refine) or specific option
 * @returns {string} prompt
 */
export function buildCreationPrompt(text, mode, option) {
  if (mode === "refine") {
    const base = `You are NEXIS, the ARC-NEXUS creation engine.

The user may provide raw collected material OR converted material.
Your job is to create the requested final product.

ABSOLUTE RULES:
- Do NOT summarize the source.
- Do NOT describe what the source is.
- Do NOT start with "The text appears to be."
- Do NOT start with "This appears to be."
- Do NOT start with "Here is a summary."
- Do NOT use markdown bold for headings.
- Use only source-supported information.
- Do not invent facts.
- Output ONLY the requested final product.
`;

    const task = `Apply this user instruction to the source content:

Instruction:
${option}

Return only the refined result.
Preserve meaning.
Do not add unsupported facts.
`;

    return `${base}

TASK:
${task}

SOURCE CONTENT:
${text}
`;
  }

  throw new Error(`buildCreationPrompt: unsupported mode "${mode}" in local mode. Use backend for format/argument.`);
}
