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

function transformPrompt(text, option) {

  if (option === "Outline") {
    return `SOURCE TEXT:
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
    return `SOURCE TEXT:
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
    return `SOURCE TEXT:
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
    return `SOURCE TEXT:
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
    return `SOURCE TEXT:
${text}

TASK:
Rewrite to be more engaging and readable.

RULES:
- Keep all facts accurate
- Add natural, active tone
- Improve sentence rhythm and variety
- Do NOT invent information
- Do NOT change meaning
- Do NOT summarize

OUTPUT:
Return rewritten text only.
`;
  }

  if (option === "Hook Script") {
    return `SOURCE TEXT:
${text}

TASK:
Transform the source into creator-ready hook content.

CRITICAL:
- Do NOT summarize
- Do NOT describe the source
- Do NOT say "this appears to be"
- Do NOT write an overview
- Write directly to an audience
- Use tension, stakes, surprise, warning, or practical insight

RETURN ONLY:

Hook:
<one or two high-impact spoken lines>

Why it matters:
<one or two lines explaining the stakes>

Script:
<short spoken line>
<short spoken line>
<short spoken line>
<short spoken line>

CTA:
<one short closing line>
`;
  }

  if (option === "Dialogue Script") {
    return `SOURCE TEXT:
${text}

TASK:
Transform the source into a dialogue script.

CRITICAL:
- Do NOT summarize
- Do NOT describe the source
- Do NOT say "this appears to be"
- Do NOT write an overview
- Create usable dialogue based only on source content

RETURN ONLY:

Title:
<short title>

Speaker 1:
<spoken line>

Speaker 2:
<spoken line>

Speaker 1:
<spoken line>

Speaker 2:
<spoken line>

Speaker 1:
<spoken line>

Speaker 2:
<spoken line>
`;
  }

  if (option === "Title Suggestions") {
    return `SOURCE TEXT:
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
    return `SOURCE TEXT:
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
