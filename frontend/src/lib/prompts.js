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

TONE:
- Neutral and analytical -- not cinematic, not emotional, not persuasive
- Reads like a research briefing or analyst prep notes
- Avoid narrative padding, filler sentences, and AI-style transitions

LIGHT ATTRIBUTION AWARENESS:
Do not harden interpretive or disputed claims into plain facts.
When a claim is sourced, contested, or interpretive, use safer phrasing:
  "Sources suggest..."
  "According to the document..."
  "The infographic argues..."
  "The sources collectively describe..."
  "The document claims..."
Do NOT present disputed interpretations as established fact.
Do NOT use emotionally loaded certainty language.

ANTI-GENERIC-FALLBACK:
Avoid filler phrases that weaken analytical output.
BANNED phrases:
  "complex relationship"
  "nuanced issue"
  "multifaceted dynamic"
  "evolving landscape"
  "complicated history"
  "long-standing tensions"
Instead, state the specific facts, specific contradictions, or what is specifically unresolved.
WRONG: "The relationship is complex and multifaceted."
RIGHT: "The sources describe strategic cooperation alongside documented policy disagreements."

DATE AND TIMELINE SAFETY:
- Do NOT infer exact dates unless directly supported by source material
- Do NOT fabricate years, exact decades, or chronology markers
- If a date is uncertain, use approximate framing: "early 1980s", "mid-2010s", "around 2003"
- If no date is available: omit the date, or use relative markers ("Before X", "Following the incident")
- If sources disagree on timing or dates, explicitly flag the discrepancy

CONFLICTING SOURCE HANDLING:
If multiple sources disagree:
- identify the disagreement clearly
- avoid presenting uncertain information as settled fact
- use wording such as:
  - "One source reported..."
  - "Another report stated..."
  - "The sources differed on..."
- do not silently choose one version

SECTION DISCIPLINE:
- Output ONLY the section requested
- Do NOT generate other sections unprompted
- Avoid repetition across sections

FORMATTING:
- Keep sections clearly separated
- Avoid repetitive wording
- Avoid AI-style filler language
- Use concise bullets or sentences -- no paragraph-sized bullet points
- Avoid dense unbroken blocks`;

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
  - "Following the incident"

If sources contain conflicting dates, names, or factual claims:
- explicitly identify the conflict
- do not silently choose one version

Never fabricate years, chronology markers, or relative time references (yesterday, today, recently, this morning) unless explicitly stated in the source.

Use all selected sources together as context.

TONE:
- Analytical and skeptical, not cinematic or documentary
- Evidence-first: lead with what the source actually shows, then draw from it
- Blunt: state what is in the source, not what is comfortable
- Nonpartisan: do not advocate for any party, ideology, or political figure
- NOT activist voice, NOT school-report voice, NOT narrator voice

ANTI-SOFTENING:
- Do not reframe hard claims as "complex" or "nuanced" when the source states them directly
- Do not convert documented specifics into vague "partnership" or "relationship" language
- Do not add diplomatic hedges to claims the source states plainly
- Do not smooth out tensions or contradictions -- preserve them

ANTI-LOADED-LANGUAGE:
Do not introduce emotionally loaded wording unless it is directly present in the source.
Loaded wording requires attribution before use:
  "unauthorized", "illegal", "rogue", "extremist", "war crime", "coup"
If such terms appear in the source, attribute them:
  "source characterizes as..."
  "described by critics as..."
  "described by supporters as..."
  "according to the source..."
Preferred neutral framings when attribution is needed:
  Instead of "unauthorized strikes":
    use "strikes with limited or disputed coordination, according to the source"
  Instead of "illegal occupation":
    use "occupation, which the source describes as illegal"

GENERIC-FALLBACK-SUPPRESSION:
Avoid generic fallback phrases. They weaken analytical output.
BANNED phrases:
  "complex relationship"
  "nuanced issue"
  "multifaceted dynamic"
  "evolving landscape"
  "complicated history"
  "long-standing tensions"
  "it's complicated"
Instead:
  State the specific contradiction directly.
  State the specific evidence.
  State what is unresolved and why.
WRONG: "The relationship is complex..."
RIGHT: "The sources show operational cooperation alongside documented policy disagreements."

ANTI-FABRICATION:
- Do not invent CTAs, upcoming projects, documentary series, or content promotions
- Do not invent dialogue or assign motives not stated in the source
- Do not add legal conclusions not supported by the source
- Do not import outside knowledge to fill gaps -- flag gaps explicitly

ATTRIBUTION RULES:
Distinguish clearly between:
  VERIFIED    -- directly documented, officially recorded, established historical fact
  CLAIMED     -- stated by a party in the source but not independently verified
  INFERRED    -- conclusion drawn from evidence but not explicitly stated in the source
  ALLEGED     -- asserted without corroborating documentation

Use attribution language for anything that is not a directly documented fact:
  "source argues"
  "document claims"
  "analysis suggests"
  "critics argue"
  "supporters contend"
Do NOT write interpretive framing as established fact.
WRONG: "Israel acted contrary to U.S. geopolitical strategy"
RIGHT: "Source argues Israel acted contrary to stated U.S. geopolitical goals."

QUOTE HANDLING:
- ONLY DIRECT QUOTE sections may contain quotation marks
- PARAPHRASED CLAIM sections must NEVER use quotation marks
- SOURCE SUMMARY sections must NEVER use quotation marks
- Only use quotation marks for text that appears verbatim or near-verbatim in the source
- Label paraphrases as:    PARAPHRASED CLAIM: [reworded claim, attributed to source]
- Label compressed source positions as:    SOURCE SUMMARY: [compressed representation of source position]
- Do NOT sanitize or soften strong statements when pulling quotes

SOURCE-WEIGHT AWARENESS:
When the source type or framing can be identified, apply source-weight awareness:

  HIGH RELIABILITY SIGNALS:
    - Official agreements, treaties, legislative records
    - Primary documents with institutional authorship
    - Direct institutional statements on the record

  MEDIUM RELIABILITY SIGNALS:
    - Policy analysis and expert interpretation
    - Historical synthesis with cited evidence
    - Academic or research framing with methodology stated

  LOWER RELIABILITY SIGNALS:
    - Emotionally framed infographics without citations
    - Unsourced assertions
    - Anonymous or unattributed claims
    - Implied motive claims without supporting documentation

  IMPORTANT:
    Source-weight awareness is NOT censorship.
    Do NOT dismiss lower-reliability sources -- flag their signal level.
    Do NOT use politically biased language when describing source reliability.
    Do NOT suppress viewpoints -- note how they are sourced.
    Lower-reliability sources may still contain facts; distinguish the claim from its sourcing.

UNCERTAINTY HANDLING:
- Flag interpretive claims with [interpretive]
- Do not present ambiguous information as settled fact
- If the source omits key context, say so explicitly

MULTI-THEME SYNTHESIS:
When source material covers multiple distinct themes, detect and preserve all major thematic lanes.
Do NOT collapse everything into one dominant narrative thread.
Prioritize DISTINCT themes -- the strongest distinct angle matters more than the most repeated angle.
One representative item per distinct lane is more valuable than three variants of the same theme.

THEME PRIORITIZATION LOGIC:
Do NOT use: "most repeated topic wins"
DO use: "highest-impact distinct themes survive"
Goal: represent the true breadth of the source material, not just the loudest thread.

REDUNDANCY REDUCTION:
To gain thematic breadth, reduce:
- Repeated alliance or relationship phrasing
- Duplicate aid or policy references covering the same angle
- Near-identical bullets restating the same point
Trade redundancy for thematic breadth.

CREATOR VALUE TEST:
Each section must pass: "If a creator consumed all source material, would this package feel representative of what they provided?"
If not -- expand thematic preservation before adding more detail on any single theme.

CONCEPT DISTRIBUTION DISCIPLINE:
Each Creator Package section serves a DISTINCT purpose. Do NOT re-explain the same concept in every section.
  Creator Angle Map:      broad content strategy; identify major angles; establish why topic is discussable
  Video Script Framework: pacing and flow; develop angles into beats -- do NOT restate the angle map
  Real Quote Pulls:       source-backed direct material only; no strategic framing; no commentary
  Commentary Lines:       creator-usable spoken riffs; do NOT repeat phrasing from the angle map or script
  Title Suggestions:      discovery and packaging only
  Keywords:               platform discoverability only

KEY RULE:
Introduce a concept ONCE in the section where it belongs. Do NOT re-explain it in every subsequent section.
If a concept appears in the Creator Angle Map, the Video Script Framework should DEVELOP it into beats -- not restate it.
If a concept appears in the Video Script Framework, Commentary Lines should RIFF on it -- not restate it.
Redundancy across sections wastes space. Each section must add NEW value.

SECTION DISCIPLINE:
- Output ONLY the section requested
- Do NOT generate other sections unprompted
- Do NOT confuse sections (Hook Options is not Video Script Framework; Real Quote Pulls is not Commentary Lines)
- Real Quote Pulls: DIRECT QUOTES only -- no paraphrased claims, no source summaries
- Commentary Lines: generated creator voice only -- no source attribution as if quoting
- Video Script Framework: do NOT append a "Modular Material for Adaptation" section -- the acts are the modular material`;


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

RULES:
- Use ONLY content present in the source
- Do NOT add information or interpretation not in the source
- Do NOT repeat the same concept across multiple sections
- 3 to 6 top-level sections maximum
- Subpoints must be concise -- no paragraph-sized bullets
- Group related items together
- Style: briefing notes, not textbook notes

RETURN ONLY:

Title:
<clear title derived from source>

I. <main section or topic>
   A. <concise subpoint>
   B. <concise subpoint>

II. <main section or topic>
   A. <concise subpoint>
   B. <concise subpoint>

(continue up to 6 top-level sections maximum)
`;
  }

  if (option === "Timeline") {
    return `${_rulesPreamble}SOURCE TEXT:
${text}

TASK:
Extract a chronological timeline of events from the source.

FORMAT:
<date or period> -- <event>

RULES:
- Use ONLY dates and events explicitly stated in the source
- Do NOT infer or guess exact dates -- use only dates the source provides
- If a date is uncertain or absent, use approximate framing: "early 1980s", "mid-2010s"
- If no date is available, use relative markers: "Before X", "After Y", "Following the incident"
- Do NOT anchor events to years not present in the source
- Do NOT duplicate events -- one entry per distinct event
- Order chronologically
- One sentence maximum per entry
`;
  }

  if (option === "Key Points") {
    return `${_rulesPreamble}SOURCE TEXT:
${text}

TASK:
Extract the key points as a numbered list.

RULES:
- HARD LIMIT: 15 points maximum -- prioritize the strongest and most essential
- Strongest and most important points first
- Each point must be a complete, standalone sentence
- Merge overlapping or near-duplicate points into one
- Use only content from the source
- Do NOT add commentary or explanation
- Do NOT infer or summarize beyond what is stated
- Avoid rephrasing the same fact multiple ways
`;
  }

  if (option === "Summary") {
    return `${_rulesPreamble}SOURCE TEXT:
${text}

TASK:
Write a structured analytical summary of the source material.

STRICT OUTPUT RULES:
- Use ONLY content present in the source -- do NOT add outside knowledge
- Do NOT infer, speculate, or assume anything not stated
- Keep tone strictly neutral and analytical -- not cinematic, not narrative
- Remove repetition and filler
- Preserve important names, numbers, dates, and specifics
- Write in concise paragraphs -- do NOT use bullet points
- Do NOT create a conclusion section
- Do NOT describe the document itself (e.g., "the source covers", "this document explains")
- Apply light attribution phrasing where claims are sourced or contested:
    "According to the document..." / "Sources suggest..." / "The sources collectively describe..."
- Avoid generic fallback phrases: "complex relationship", "multifaceted", "nuanced"

RETURN ONLY:

=== Summary ===

Topic:
<one sentence: what this source is about, derived from source content only>

Coverage:
<2-3 sentences: what the source covers, in the order it appears>

Key Information:
<tightly written sentences preserving the most important information; use attribution phrasing for contested or sourced claims; prioritize information density>

What the Sources Show:
<analytical synthesis of what the sources collectively describe or demonstrate; not a restatement of Key Information>

What Remains Unclear:
<gaps, conflicts, or unresolved questions in the source material; omit this section entirely if nothing is unclear>
`;
  }

  if (option === "Make Engaging") {
    return `${_creatorPreamble}SOURCE TEXT:
${text}

TASK:
Build a creator angle map from the source material.
Purpose: help a creator identify what angles exist, where the discussable tension lives, and what makes this worth covering.
Tone: analytical, skeptical, concise. NOT a summary. NOT a report. NOT a policy brief.

REQUIRED STRUCTURE:

=== Creator Angle Map ===

Main Angle:
The central claim or finding the source supports. One to three sentences. Direct.
Attribute if interpretive: use "source argues", "analysis claims", "document shows".

Supporting Angles:
The additional distinct angles present in the source.
Do NOT collapse everything into the main angle -- preserve thematic breadth.
List each as:
  - [Angle]: brief one-line description
  - [Angle]: brief one-line description

Contradiction / Tension:
What in the source conflicts, contradicts, or complicates the main angle?
If multiple tensions exist, list each separately -- do NOT compress into one.
Attribute competing positions: "Source A states X; Source B states Y."

What Makes This Discussable:
What is hook-worthy, debatable, surprising, or shareable about this material?
What would make a viewer pause, push back, or want to share?
State it bluntly. Do NOT write in narrator voice.

What Remains Unclear:
Gaps, conflicts, or unresolved questions in the source material.
Omit this section entirely if nothing is unclear.

=== Evidence & Source Notes ===

Strongest Evidence:
The most concrete facts from the source.
MULTI-THEME RULE: one item per distinct angle where possible. Do NOT give three bullets from the same angle.
Label each:
  VERIFIED: <directly documented or officially recorded fact>
  CLAIMED:  <stated by a party, not independently verified>
  INFERRED: <conclusion drawn from evidence, not explicitly stated>

Source Reliability:
Label each source with its framing type and reliability tier:
  OFFICIAL FRAMING      | HIGH RELIABILITY     -- government docs, treaties, institutional records
  HISTORICAL CRITICISM  | MEDIUM RELIABILITY   -- historical analysis, academic review
  COMMENTARY FRAMING    | MEDIUM RELIABILITY   -- editorial, pundit, video commentary
  INFOGRAPHIC NARRATIVE | LOWER RELIABILITY    -- visual media claims, advocacy graphics
  DOCUMENTARY CLAIMS    | LOWER RELIABILITY    -- film, docuseries assertions
Note briefly what each source contributes. Do NOT dismiss lower-reliability sources.

Source Position Comparison:
| Source / Stakeholder | Framing Type | Position |
|----------------------|--------------|----------|
| [source or party]    | [type]       | [what they assert] |
Add one row per distinct position.

STRICT RULES:
- Do NOT write this as a summary, report, or policy brief
- Do NOT merge interpretation with verified fact without labeling
- Do NOT soften documented specifics into vague language
- Attribute non-verified claims: "source claims", "document argues", "analysis suggests"
- Flag every interpretive conclusion with [interpretive]
- Do NOT use generic fallback phrases: "complex relationship", "nuanced issue", "multifaceted dynamic"
  Instead: state the specific contradiction, evidence, or gap directly
`;
  }

  if (option === "Video Script Framework") {
    return `${_creatorPreamble}SOURCE TEXT:
${text}

TASK:
Build a modular video script framework from the source material.
Purpose: give the creator structured material they can adapt -- NOT a rigid monologue to read verbatim.
Tone: analytical commentary. NOT documentary narration. NOT activist framing.

Each act provides: purpose, talking points, a suggested visual, and an audience reaction target.
Acts must PROGRESS -- each act advances the video. No act restates content from a previous act.
Do NOT re-introduce angles already covered in the Creator Angle Map -- develop them into specific beats.

REQUIRED STRUCTURE:

ACT 1 — Opening / Hook
Purpose: Grab attention with the sharpest documented fact or contradiction from the source.
Hook Options:
  Neutral:   <a factual opening that states clearly what this is about>
  Skeptical: <a hook that questions or challenges the surface-level framing>
  Punchy:    <a blunt, direct opening that names the tension immediately>
Talking Points (2-3 max):
- <talking point from source>
- <talking point from source>
Suggested Visual: <brief practical note: text card, opening graphic, or footage type>
Audience Reaction Target: <what the viewer should think or feel at this point>

ACT 2 — Context
Purpose: Establish the background clearly and efficiently. Who, what, where. No essays.
Key Setup: Use attribution where needed: "According to [source]..."
Talking Points (2-3 max):
- <contextual fact or framing -- must be NEW, not a restatement of ACT 1>
- <contextual fact or framing -- must be NEW, not a restatement of ACT 1>
Suggested Visual: <brief practical note: map, timeline, document screenshot, or infographic>
Audience Reaction Target: <what the viewer should understand at this point>

ACT 3 — Tension / Contradiction
Purpose: Show the gap between the public narrative and what the source actually documents.
Transition Line: <one line that moves the viewer from context into the core tension>
Talking Points (2-3 max):
- <tension point -- must be NEW, not a restatement of ACT 1 or ACT 2>
- <tension point from source>
Suggested Visual: <brief practical note: comparison graphic, side-by-side, or contrast text card>
Audience Reaction Target: "Wait, how can both be true?" or similar moment of productive doubt

ACT 4 — Evidence / Examples
Purpose: Ground the tension with specific documented material. Names, numbers, events.
Evidence Beats:
  VERIFIED: <directly documented fact>
  CLAIMED:  <party assertion not independently verified>
  INFERRED: <conclusion drawn from evidence>
Talking Points (2-3 max):
- <evidence-grounded talking point -- must be a specific fact, not a restatement of ACT 3 framing>
- <evidence-grounded talking point>
Suggested Visual: <brief practical note: data chart, document excerpt, or event timeline>
Audience Reaction Target: <viewer should feel the evidence is concrete and specific>

ACT 5 — What Remains Unclear
Purpose: Acknowledge what the source does not resolve. Builds credibility.
Open Questions:
- <gap or unresolved question from the source>
- <gap or unresolved question from the source>
Talking Points (2-3 max):
- <how to raise these questions on camera without overreaching>
Suggested Visual: <brief practical note: question card or unresolved thread graphic>
Audience Reaction Target: <viewer should feel the creator is being honest about limits>

ACT 6 — Closing / Viewer Takeaway
Purpose: Give the creator a strong, grounded exit. No overreach beyond what the source supports.
Closing Options:
  Neutral:        <restates what is established without overreaching>
  Strong:         <names the most important implication the source supports>
  Question-based: <leaves the audience with the sharpest open question>
Suggested Visual: <brief practical note: title card, outro graphic, or final text>
Audience Reaction Target: <viewer should leave with a clear takeaway or a specific open question>

STRICT RULES:
- Do NOT write one rigid monologue
- Provide modular material the creator adapts to their own voice
- Each act must ADVANCE the video -- do NOT restate content from previous acts
- Do NOT append a "Modular Material for Adaptation" section -- the acts themselves are the modular material
- Do NOT invent dialogue, dates, or events not in the source
- Attribute interpretive claims: "source argues", "critics claim", "document suggests"
- Do NOT soften hard claims
- No CTAs, no series promotions, no invented projects
- Do NOT introduce loaded wording unless directly present in the source; if present, attribute it
- Do NOT use generic fallback phrases: "complex relationship", "nuanced issue", "multifaceted dynamic"
`;
  }

  if (option === "Hook Options") {
    return `${_creatorPreamble}SOURCE TEXT:
${text}

TASK:
Write 3 punchy opening hooks for a creator video.
Target: YouTube commentary opener or livestream hook.
One sentence preferred. Two sentences maximum.

Each hook must:
- Use a specific fact, number, contradiction, or named claim from the source
- Create immediate tension or a question the viewer needs answered
- Be grounded in source material -- no invented stakes

WHAT WORKS:
- Lead with a specific documented number, name, or event
- Pose the sharpest unanswered question from the source
- Name the contradiction directly and bluntly

WHAT TO AVOID:
- "Something big just happened..."
- "Today we're going to talk about..."
- "You won't believe..."
- Long essay-style setups
- Vague hooks without source-specific detail

Each hook must be a distinct angle -- do NOT repeat the same framing.

GOOD HOOK EXAMPLE:
"The U.S. gives Israel billions in aid without a NATO-style defense treaty -- why?"

BAD HOOK EXAMPLE:
"The relationship between the U.S. and Israel is complex and nuanced..."

Hooks should sound like a sharp commentary opener, NOT an essay introduction.

RETURN ONLY:

1. <hook>
2. <hook>
3. <hook>
`;
  }

  if (option === "Real Quote Pulls") {
    return `${_creatorPreamble}SOURCE TEXT:
${text}

TASK:
Extract real direct quotes from the source material only.
These are for direct on-screen use or spoken citation in a video.

CRITICAL RULES:
- ONLY DIRECT QUOTES are permitted in this section -- verbatim or near-verbatim text from the source
- If no exact quote exists for a pull slot, OMIT that slot entirely -- do NOT substitute a paraphrase or source summary
- Do NOT use quotation marks for anything other than verbatim source text
- Do NOT invent quotes
- Max 5 pulls. If fewer than 5 real quotes exist in the source, stop early -- output fewer pulls
- Prioritize the most striking, creator-usable verbatim lines first
- If the source contains strong or controversial statements, pull those -- do NOT substitute softer versions
- Paraphrased claims and source summaries belong in Commentary Lines, not here

Speaker/source labels:
- Use named speaker if available
- If unknown, label: "Source document" / "Video transcript" / "Infographic text"

RETURN only pull entries where a real direct quote exists:

Pull [N]:
Type: DIRECT QUOTE
Quote: "<verbatim text>"
Source/Speaker: <name or label>
Why it matters: <one line -- why a creator would use this>

Stop at 5. Do NOT invent extra pulls. Do NOT fill empty slots with paraphrase.
`;
  }

  if (option === "Commentary Lines") {
    return `${_creatorPreamble}SOURCE TEXT:
${text}

TASK:
Generate original creator-ready commentary lines based on the source material.

CRITICAL DISTINCTION:
These are NOT real quotes from any source or person.
Every line must be labeled: Generated commentary line
Do NOT mix these with real quotes. Do NOT present them as attributed to anyone.

PURPOSE:
Give the creator usable spoken lines -- grounded in the source evidence, written in creator voice.
These are RHETORICAL RIFFS on what the source shows, not information restatements.
A creator should be able to say these on camera as their own lines, not read them as summaries.

TONE VARIETY:
Generate at least one line per tone category:
  Neutral analyst  -- states what the evidence shows without loading it
                     EXAMPLE: "Public alliances and operational realities are not always the same thing."
  Skeptical        -- questions the official framing or raises doubt grounded in the source
                     EXAMPLE: "If there's no formal defense treaty, what obligations actually exist in practice?"
  Punchy           -- blunt, direct, names the tension immediately
                     EXAMPLE: "The story isn't just support versus opposition -- it's public language versus operational behavior."
  Humorous/blunt   -- calls it plainly; use only if source material supports it

RULES:
- Each line must be directly grounded in source material -- note which claim or angle it draws from
- Do NOT repeat phrasing already present in the Creator Angle Map or Video Script Framework
- Lines add RHETORICAL VALUE -- they are spoken riffs, not information restatements
- Do NOT pretend these lines are quotes from anyone
- Do NOT soften the source material when building lines
- Keep each line to 1-2 spoken sentences maximum
- Make them sound like something a creator would naturally say on camera, not read from a report

FORMAT:
Generated commentary line:
"<line>"
Tone: <Neutral / Skeptical / Punchy / Humorous/blunt>
Grounded in: <which source claim or angle this draws from>

(generate 4-6 lines total, varying tones)

STRICT:
- Do NOT use this section to summarize the source
- Do NOT write essay sentences
- Do NOT write lines a creator could not naturally say out loud
- Label every line "Generated commentary line" -- no exceptions
`;
  }

  if (option === "Title Suggestions") {
    return `${_creatorPreamble}SOURCE TEXT:
${text}

TASK:
Generate 5 title options grounded strictly in the source content.

RULES:
- Each title must reflect the actual central claim or angle of the source
- Vary the style: one factual/neutral, one question-form, one declarative/direct, one tension-based, one specific-detail-led
- Do NOT invent angles or claims not present in the source
- Do NOT use vague generic titles like "A Complex Situation" or "The Full Story"
- Titles must be specific enough that a viewer knows exactly what the video covers

RETURN ONLY:

1. <title>
2. <title>
3. <title>
4. <title>
5. <title>
`;
  }

  if (option === "Keywords") {
    return `${_creatorPreamble}SOURCE TEXT:
${text}

TASK:
Generate curated discoverability and commentary keywords from the source.
Do NOT extract entities or dump nouns. Generate keywords a creator or researcher would actually use.

RANKING PRIORITY (apply in order):
1. Searchability -- would a real person type this?
2. Creator usefulness -- does this help a creator find their audience?
3. Audience discoverability -- would this surface the video/post?
4. Commentary relevance -- does this label the topic well?
5. Controversy/engagement -- does this capture the tension or debate?

GENERATION RULES:
- Generate search phrases, not single nouns
- Use natural human phrasing -- the words audiences actually type
- Mix: broad searches, niche commentary, controversy framing, educational phrasing
- Infer what audiences interested in this topic would search for
- Avoid obscure institutional names, program names, or acronyms unless central to the topic
- Avoid repetitive variations of the same phrase
- Avoid generic filler: "current events", "important issue", "breaking news"
- Do not turn disputed claims into factual keywords; frame contested topics as "debate" or "controversy"
- Prioritize usefulness over completeness -- curated is better than exhaustive

HARD LIMITS:
- Discoverability Keywords: maximum 8 items
- Commentary Topics: maximum 6 items
- Suggested Search Queries: maximum 5 items
- Platform Tags: maximum 12 tags

REQUIRED OUTPUT STRUCTURE:

=== Discoverability Keywords ===
Natural human-facing phrases. Short and scannable. Creator and search-oriented.
Maximum 8. Prefer 2-3 words. Maximum 5 words each. Strongest first.
Avoid formal or academic wording. Avoid repeating the same concept in different words.
Avoid unnecessary prefixing (do not start every phrase with "u.s." or "american").
GOOD: "us israel alliance" / "military aid debate" / "middle east tensions" / "foreign policy contradictions"
BAD:  "u.s. foreign policy towards israel settlements" / "israeli ally status controversy debate"
- <phrase>
- <phrase>

=== Commentary Topics ===
Higher-level themes a creator would use as a video topic or segment label.
Maximum 6. Short scannable labels. Not search queries. Not sentence fragments.
- <theme>
- <theme>

=== Suggested Search Queries ===
Write as a real person would type into YouTube, Google, or Reddit -- not a topic descriptor.
Maximum 5. Lowercase. Conversational. Prefer question-style phrasing when natural.
GOOD: "why does the us support israel" / "how much aid does israel get from the us" / "us israel alliance explained"
BAD:  "u.s. support of israel in conflicts" / "examination of bilateral foreign policy dynamics"
- <query>
- <query>

=== Platform Tags ===
Maximum 12 tags. Hard stop at 12. No exceptions.
For YouTube, X/Twitter, TikTok, Instagram, Shorts/Reels.

TAG RULES:
- Prefer 1-2 word tags. Maximum 3 words. No ultra-long hashtags.
- No camelCase sentence hashtags. No academic or institutional phrasing.
- Prefer recognizable, commonly used tags with broad audience familiarity.
- Avoid compressed awkward wording -- prefer clear readable concepts.
  BAD: #UASupport  #AllianceDynamics  #ForeignPolicyDiscussionAnalysis
  GOOD: #USIsrael  #ForeignPolicy  #Geopolitics  #MiddleEast
- Human-usable only: every tag must pass -- "Would a real person realistically type or click this?"

ANTI-RECURSION (critical):
- Do NOT generate recursive variations of the same phrase.
  BAD:  #ForeignPolicy  #ForeignPolicyAnalysis  #ForeignPolicyDiscussion  #ForeignPolicyAnalysisVideo
  GOOD: #ForeignPolicy
- Generate ONE best version of each concept only.

NO COMBINATORIAL EXPANSION:
- Do NOT append Analysis / Discussion / Video / Explained / Debate / Commentary to every keyword.
- Use those suffix terms ONLY if central to the actual topic AND only once across all tags.

DEDUPLICATION:
- Remove repeated concepts, singular/plural duplicates, and near-identical phrasing variants.
- Keep only the strongest single version of each concept.

RANK by: discoverability → creator usefulness → audience familiarity → search likelihood → commentary relevance
TARGET STYLE: #USIsrael #ForeignPolicy #Geopolitics #MiddleEast #MilitaryAid #USPolitics #Iran #DefensePolicy #InternationalRelations #CurrentEvents

No spaces. Capitalized for readability. Output on a single line.
#Tag #Tag #Tag
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
