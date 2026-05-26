# ============================================================
# ARC-NEXUS - NEXIS ENGINE
# File: app/reconstruction.py
# Version: 015 (Summary + Creator Package Refinement)
# ============================================================

import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal

from app.services.llm_service import run_llm

# Summary Package rules — loaded once at startup and prepended to all
# Summary Package section prompts (Outline, Timeline, Key Points, Summary).
_RULES_PATH = os.path.join(os.path.dirname(__file__), "prompts", "summary_package_rules.txt")
try:
    with open(_RULES_PATH, encoding="utf-8") as _f:
        _SUMMARY_RULES = _f.read().strip()
except Exception:
    _SUMMARY_RULES = ""

# Creator Package rules — loaded once at startup and prepended to all
# Creator Package section prompts (Make Engaging, Short Video Script, etc.).
_CREATOR_RULES_PATH = os.path.join(os.path.dirname(__file__), "prompts", "creator_package_rules.txt")
try:
    with open(_CREATOR_RULES_PATH, encoding="utf-8") as _f:
        _CREATOR_RULES = _f.read().strip()
except Exception:
    _CREATOR_RULES = ""

router = APIRouter(tags=["nexis-understand"])

PresetType = Literal["summary", "creator", "explained", "analysis"]
ActionType = Literal["summarize", "extract", "transform"]


class ReconstructionRequest(BaseModel):
    text: str
    preset: PresetType
    action: ActionType
    option: str


class ReconstructionResponse(BaseModel):
    output: str


def sanitize(text: str) -> str:
    return text.replace("\u0000", "").replace("\r", "").replace("```", "").strip()


# ============================================================
# VALIDATION
# ============================================================

def validate(preset: str, action: str, option: str):
    allowed = {
        "summary": {
            "summarize": ["Short", "Medium", "Long"],
            "extract": ["Quotes", "Entities"],
            "transform": ["Outline", "Timeline", "Key Points", "Summary"],
        },
        "creator": {
            "summarize": ["Short", "Medium"],
            "extract": ["Key Points", "Quotes", "Timeline"],
            "transform": ["Make Engaging", "Short Video Script", "Hook Options", "Quote Pulls", "Title Suggestions", "Keywords"],
        },
        "explained": {
            "summarize": ["Short", "Medium"],
            "extract": ["Key Points", "Entities"],
            "transform": ["Simplify", "Improve Clarity", "Study Guide", "Paragraph"],
        },
        "analysis": {
            "summarize": ["Long"],
            "extract": ["Key Points", "Entities", "Timeline"],
            "transform": ["Make Professional", "Improve Clarity", "JSON", "Paragraph"],
        },
    }

    if preset not in allowed:
        raise HTTPException(400, f"Invalid preset: {preset}")

    if action not in allowed[preset]:
        raise HTTPException(400, f"{action} not allowed for {preset}")

    if option not in allowed[preset][action]:
        raise HTTPException(400, f"{option} not valid for {preset}.{action}")


# ============================================================
# 🔥 TRANSFORM PROMPTS
# FIXED ONLY: now routes by preset + option.
# ============================================================

def transform_prompt(text: str, preset: str, option: str) -> str:
    # Prepend synthesis rules to Summary Package section prompts only.
    # _SUMMARY_RULES is loaded from summary_package_rules.txt at module startup.
    _rules_block = (_SUMMARY_RULES + "\n\n") if _SUMMARY_RULES else ""
    _creator_block = (_CREATOR_RULES + "\n\n") if _CREATOR_RULES else ""

    # ------------------------------------------------------------
    # SUMMARY PACKAGE — OUTLINE
    # ------------------------------------------------------------
    if option == "Outline":
        return f"""{_rules_block}SOURCE TEXT:
{text}

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
"""

    # ------------------------------------------------------------
    # SUMMARY PACKAGE — TIMELINE
    # (also available as extract for other presets)
    # ------------------------------------------------------------
    if option == "Timeline":
        return f"""{_rules_block}SOURCE TEXT:
{text}

TASK:
Extract a chronological timeline of events from the source.

FORMAT:
<date or period> -- <event>

RULES:
- Use ONLY dates and events explicitly stated in the source
- Do NOT infer or guess exact dates -- use only dates the source provides
- If a date is uncertain or absent, use approximate framing: \"early 1980s\", \"mid-2010s\"
- If no date is available, use relative markers: \"Before X\", \"After Y\", \"Following the incident\"
- Do NOT anchor events to years not present in the source
- Do NOT duplicate events -- one entry per distinct event
- Order chronologically
- One sentence maximum per entry
"""

    # ------------------------------------------------------------
    # SUMMARY PACKAGE — KEY POINTS
    # ------------------------------------------------------------
    if option == "Key Points":
        return f"""{_rules_block}SOURCE TEXT:
{text}

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
"""

    # ------------------------------------------------------------
    # SUMMARY PACKAGE — SUMMARY
    # ------------------------------------------------------------
    if option == "Summary":
        return f"""{_rules_block}SOURCE TEXT:
{text}

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
- Do NOT describe the document itself (e.g., \"the source covers\", \"this document explains\")
- Apply light attribution phrasing where claims are sourced or contested:
    \"According to the document...\" / \"Sources suggest...\" / \"The sources collectively describe...\"
- Avoid generic fallback phrases: \"complex relationship\", \"multifaceted\", \"nuanced\"

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
"""

    # ------------------------------------------------------------
    # SIMPLIFY
    # ------------------------------------------------------------
    if option == "Simplify":
        return f"""SOURCE TEXT:
{text}

TASK:
Rewrite in simpler language.

RULES:
- Keep meaning identical
- Use shorter sentences and common words
- Do NOT remove key information
- Do NOT summarize
- Do NOT add ideas

OUTPUT:
Return simplified text only.
"""

    # ------------------------------------------------------------
    # IMPROVE CLARITY
    # ------------------------------------------------------------
    if option == "Improve Clarity":
        return f"""SOURCE TEXT:
{text}

TASK:
Rewrite the text to improve clarity.

RULES:
- Preserve ALL original meaning exactly
- Do NOT add interpretation or new ideas
- Do NOT summarize or remove important detail
- Remove redundancy and vague language
- Strengthen cause and effect relationships
- Improve sentence structure and flow
- Keep neutral, professional tone

FORBIDDEN:
- "This appears to be"
- "The instructor explains"
- Any summarizing language

OUTPUT:
Return ONLY the rewritten text.
"""

    # ------------------------------------------------------------
    # CREATOR — MAKE ENGAGING
    # ------------------------------------------------------------
    if option == "Make Engaging":
        return f"""{_creator_block}SOURCE TEXT:
{text}

TASK:
Produce a structured evidence-first breakdown of the source material for creator research.
Tone: analytical, skeptical, concise. NOT documentary narration. NOT activist framing.

REQUIRED STRUCTURE:

Core Angle:
The central claim or finding the source supports. One to three sentences. Direct.
Attribute if interpretive: use "source argues", "analysis claims", "document shows".

Strongest Evidence:
The most concrete, directly documented facts from the source.
Label each item:
  VERIFIED: <directly documented or officially recorded fact>
  CLAIMED:  <stated by a source party, not independently verified>
  INFERRED: <conclusion drawn from evidence, not explicitly stated>

Tension/Contradiction:
What in the source conflicts with official positions, prior claims, or expected narratives?
What is denied, unresolved, or contradicted?
Attribute competing positions: "Source A states X; Source B states Y."

=== Evidence Confidence ===

HIGH:
- [directly documented events, official agreements, established historical records from this source]

MEDIUM:
- [analytical interpretations, disputed framing, contextual conclusions drawn from the evidence]

LOW:
- [motive assumptions, implied intentionality, unsupported extrapolations]

=== Source Reliability Signals ===

Rate each source used, based on signal strength:

HIGH RELIABILITY:
- [official document, treaty, institutional record, on-the-record primary statement]

MEDIUM RELIABILITY:
- [policy analysis, expert interpretation, historical synthesis with stated methodology]

LOWER RELIABILITY:
- [infographic without citations, unsourced assertion, anonymous claim, implied motive without documentation]

Explain briefly why each source is weighted where it is.
Do NOT dismiss lower-reliability sources -- flag the signal level and note what they contribute.
Do NOT use politically biased language when describing source reliability.

=== Source Position Comparison ===

| Source / Stakeholder | Position |
|----------------------|----------|
| [source or party]    | [what they assert] |
| [source or party]    | [what they assert] |

Add one row per distinct position present in the sources.

Narrative:
Synthesize the sources into a concise, creator-ready summary.
Use analytical commentary tone: "The sources collectively show..." / "What the evidence establishes..." / "What remains unclear..."
Attribute all interpretive language. Flag gaps explicitly.
Do NOT write in cinematic or documentary voice.
Do NOT invent context. Do NOT smooth contradictions.

STRICT RULES:
- Do NOT merge interpretation with verified fact without labeling
- Do NOT soften documented specifics into vague language
- Attribute non-verified claims: "source claims", "document argues", "analysis suggests"
- Flag every interpretive conclusion with [interpretive]
- Do NOT write "in a world where..." or "this story reveals..."
- Do NOT introduce loaded wording unless directly present in the source; if present, attribute it
- Do NOT use generic fallback phrases: "complex relationship", "nuanced issue", "multifaceted dynamic"
  Instead: state the specific contradiction, evidence, or gap directly
"""

    # ------------------------------------------------------------
    # MAKE PROFESSIONAL
    # ------------------------------------------------------------
    if option == "Make Professional":
        return f"""SOURCE TEXT:
{text}

TASK:
Rewrite in a formal, professional tone.

RULES:
- Use precise, formal language
- Remove slang, casual phrasing, and filler
- Maintain logical structure
- Preserve meaning exactly
- Do NOT summarize

OUTPUT:
Return rewritten text only.
"""

    # ------------------------------------------------------------
    # STUDY GUIDE
    # ------------------------------------------------------------
    if option == "Study Guide":
        return f"""SOURCE TEXT:
{text}

TASK:
Create a structured study guide.

CRITICAL:
- Do NOT summarize
- Do NOT describe the source
- Do NOT say "this appears to be"
- Extract concrete, testable content

RETURN ONLY:

Title:
<clear title>

Core Concepts:
- <definition or concept>
- <definition or concept>
- <definition or concept>

Key Rules:
- <decision rule or principle>
- <decision rule or principle>

Examples:
- <scenario-based example>
- <scenario-based example>

Quick Review:
- <test-style takeaway>
- <test-style takeaway>
"""

    # ------------------------------------------------------------
    # PARAGRAPH — STUDENT / EXPLAINED / ANALYSIS
    # ------------------------------------------------------------
    if option == "Paragraph":
        return f"""SOURCE TEXT:
{text}

TASK:
Rewrite into ONE clean paragraph.

RULES:
- No headings
- No bullets
- Preserve meaning
- Do not summarize aggressively
- Do not add new information
"""

    # ------------------------------------------------------------
    # CREATOR — HOOK OPTIONS
    # ------------------------------------------------------------
    if option == "Hook Options":
        return f"""{_creator_block}SOURCE TEXT:
{text}

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
"""

    # ------------------------------------------------------------
    # CREATOR — QUOTE PULLS
    # ------------------------------------------------------------
    if option == "Quote Pulls":
        return f"""{_creator_block}SOURCE TEXT:
{text}

TASK:
Extract quote pulls from the source material.

CRITICAL FORMATTING RULE:
ONLY DIRECT QUOTE sections may contain quotation marks.
PARAPHRASED CLAIM sections must NEVER use quotation marks.
SOURCE SUMMARY sections must NEVER use quotation marks.

Use ONLY the label that matches what the source actually contains:

DIRECT QUOTE:
  For text that appears verbatim or near-verbatim in the source.
  Wrap in quotation marks: "exact text from source"

PARAPHRASED CLAIM:
  For a clear claim in the source that has no quotable exact text.
  Do NOT use quotation marks.
  Format: PARAPHRASED CLAIM: [reworded claim, attributed to source]

SOURCE SUMMARY:
  For a factual pattern or position with no specific quotable line.
  Format: SOURCE SUMMARY: [compressed representation of source position]

RULES:
- Pull the most striking and usable lines first
- If the source contains strong or controversial statements, pull those -- do NOT substitute softer versions
- Do NOT put paraphrases in quotation marks
- Do NOT invent or fabricate quotes
- Do NOT sanitize or soften pulled content

RETURN:

Pull 1:
[DIRECT QUOTE / PARAPHRASED CLAIM / SOURCE SUMMARY]
"<verbatim text>" or <paraphrase>

Pull 2:
[DIRECT QUOTE / PARAPHRASED CLAIM / SOURCE SUMMARY]
"<verbatim text>" or <paraphrase>

Pull 3:
[DIRECT QUOTE / PARAPHRASED CLAIM / SOURCE SUMMARY]
"<verbatim text>" or <paraphrase>

Pull 4:
[DIRECT QUOTE / PARAPHRASED CLAIM / SOURCE SUMMARY]
"<verbatim text>" or <paraphrase>
"""

    # ------------------------------------------------------------
    # CREATOR — SHORT VIDEO SCRIPT
    # ------------------------------------------------------------
    if option == "Short Video Script":
        return f"""{_creator_block}SOURCE TEXT:
{text}

TASK:
Write a complete 30-60 second spoken video script grounded in the source.
Tone: analytical commentary. NOT documentary narration. NOT activist framing.

REQUIRED STRUCTURE:

HOOK:
One sentence. The most striking documented fact or contradiction from the source. Specific.

CONTEXT:
Two to three spoken lines. Who, what, where.
Use attribution when stating claims: "According to [source]..."

CONFLICT/TENSION:
The core contradiction or unanswered question.
State competing positions if present. Do not resolve what the source leaves unresolved.

KEY FACTS:
Three to five lines. One per line, in spoken language.
Label where the distinction matters: VERIFIED: / CLAIMED: / INFERRED:

CLOSING:
One to two sentences grounded in what the evidence actually shows.
Do NOT invent a CTA, upcoming projects, or series.

STRICT RULES:
- Do NOT write in cinematic or documentary voice
- Do NOT write "in a world where..." or "this story reveals..."
- Do NOT invent dialogue, dates, or events not in the source
- Attribute interpretive claims: "source argues", "critics claim", "document suggests"
- Do NOT soften hard claims
- No CTAs
- Do NOT introduce loaded wording unless directly present in the source; if present, attribute it
- Do NOT use generic fallback phrases: "complex relationship", "nuanced issue", "multifaceted dynamic"
"""

    # ------------------------------------------------------------
    # CREATOR PACKAGE — TITLE SUGGESTIONS
    # ------------------------------------------------------------
    if option == "Title Suggestions":
        return f"""{_creator_block}SOURCE TEXT:
{text}

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
"""

    # ------------------------------------------------------------
    # CREATOR PACKAGE — KEYWORDS
    # ------------------------------------------------------------
    if option == "Keywords":
        return f"""{_creator_block}SOURCE TEXT:
{text}

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
"""

    # ------------------------------------------------------------
    # ANALYSIS — JSON
    # ------------------------------------------------------------
    if option == "JSON":
        return f"""SOURCE TEXT:
{text}

TASK:
Transform the source into valid JSON.

CRITICAL:
- Return ONLY valid JSON
- No markdown
- No explanation
- No text before JSON
- No text after JSON
- Use only source content
- Do not invent information

RETURN ONLY THIS JSON SHAPE:

{{
  "events": [
    {{
      "date": "",
      "event": "",
      "source_detail": ""
    }}
  ],
  "entities": [
    {{
      "name": "",
      "type": "",
      "role_or_relevance": ""
    }}
  ],
  "claims": [
    {{
      "claim": "",
      "supporting_detail": "",
      "confidence": "source-stated"
    }}
  ]
}}
"""

    raise HTTPException(400, f"No transform prompt for {preset}.{option}")


# ============================================================
# PROMPT BUILDER
# ============================================================

def build_prompt(text: str, preset: str, action: str, option: str) -> str:

    if action == "transform":
        return transform_prompt(text, preset, option)

    if action == "summarize":
        if option == "Short":
            return f"""SOURCE TEXT:
{text}

TASK:
Write a 2–3 sentence summary.

RULES:
- Preserve all key facts
- No bullets, no headings
- Do NOT add information not in the source
"""
        elif option == "Medium":
            return f"""SOURCE TEXT:
{text}

TASK:
Write a 2-paragraph summary.

RULES:
- First paragraph: main idea and context
- Second paragraph: supporting detail and outcome
- No bullets, no headings
- Do NOT add information not in the source
"""
        elif option == "Long":
            return f"""SOURCE TEXT:
{text}

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
"""
        else:
            raise HTTPException(400, "Invalid summarize option")

    elif action == "extract":
        if option == "Key Points":
            return f"""SOURCE TEXT:
{text}

TASK:
Extract the key points as a numbered list.

RULES:
- Each point must be a complete, standalone sentence
- Use only content from the source
- No commentary, no added explanation
"""
        elif option == "Quotes":
            return f"""SOURCE TEXT:
{text}

TASK:
Extract direct quotes only.

RULES:
- Format each quote as: "<quote>"
- Do NOT paraphrase
- Do NOT add commentary
- Only include text that appears verbatim in the source
"""
        elif option == "Entities":
            return f"""SOURCE TEXT:
{text}

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
"""
        elif option == "Timeline":
            return f"""SOURCE TEXT:
{text}

TASK:
Extract a chronological timeline of events.

FORMAT:
<date or period> — <event>
<date or period> — <event>

RULES:
- Use only what is stated in the source
- Do NOT infer or add events
- Order chronologically
"""
        else:
            raise HTTPException(400, "Invalid extract option")

    else:
        raise HTTPException(400, "Invalid action")


# ============================================================
# SHARED INNER LOGIC
# Used by both /convert and /understand (legacy) endpoints
# so DB enforcement runs exactly once per request.
# ============================================================

async def _run_convert(
    request: ReconstructionRequest,
) -> ReconstructionResponse:

    clean_text = sanitize(request.text)

    if not clean_text:
        raise HTTPException(400, "Text cannot be empty.")

    # Limit checks and usage increments are handled at the package level
    # by the frontend via /api/usage/convert/check and /api/usage/convert/complete.
    # This route runs one section; it does not track usage per section.

    validate(request.preset, request.action, request.option)

    prompt = build_prompt(
        clean_text,
        request.preset,
        request.action,
        request.option,
    )

    output = await run_llm(prompt)

    return ReconstructionResponse(output=output)


# ============================================================
# ROUTE
# ============================================================

@router.post("/convert", response_model=ReconstructionResponse)
async def convert(request: ReconstructionRequest):
    return await _run_convert(request)


# ------------------------------------------------------------
# Legacy support
# ------------------------------------------------------------

@router.post("/understand", response_model=ReconstructionResponse)
async def understand_legacy(request: ReconstructionRequest):
    return await _run_convert(request)