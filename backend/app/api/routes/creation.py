from fastapi import APIRouter
from pydantic import BaseModel
from app.services.llm_service import run_llm

router = APIRouter()


class CreationRequest(BaseModel):
    tool: str      # reporting | tone | analysis | script | arc_nexus
    option: str    # specific mode within the tool
    input: str     # raw text: article, transcript, notes, etc.


@router.post("/create")
async def create_endpoint(payload: CreationRequest):
    tool = payload.tool
    option = payload.option
    text = payload.input

    # -----------------------------
    # REPORTING / NEWS BREAKDOWN
    # -----------------------------
    if tool == "reporting":
        if option == "straight-report":
            prompt = f"""
You are writing a neutral, factual news report based on the following material.

Source Material:
{text}

Task:
- Write a clear, structured news-style report.
- No opinion, no spin, no exaggeration.
- Include: what happened, who is involved, where, when, and why it matters.
- Aim for a 2–3 minute spoken script.
"""
        elif option == "explainer":
            prompt = f"""
You are creating an explainer video script based on the following material.

Source Material:
{text}

Task:
- Explain the topic step-by-step in simple, clear language.
- Assume the viewer has no prior knowledge.
- Use a logical flow: context → what it is → how it works → why it matters.
- Aim for a 2–3 minute spoken script.
"""
        elif option == "timeline":
            prompt = f"""
You are creating a timeline of events based on the following material.

Source Material:
{text}

Task:
- Extract key events and present them in chronological order.
- For each event, include: date/time (if available), what happened, and why it matters.
- Format as a script suitable for a 2–3 minute video.
"""
        elif option == "key-points":
            prompt = f"""
You are creating a key-points summary for a short video.

Source Material:
{text}

Task:
- Extract the most important points.
- Present them as punchy, clear bullets.
- Make it suitable for a 1–2 minute spoken script.
"""
        elif option == "claims-vs-facts":
            prompt = f"""
You are analyzing claims versus facts based on the following material.

Source Material:
{text}

Task:
- Identify key claims made in the material.
- For each claim, separate:
  - The claim itself.
  - Any supporting evidence mentioned.
  - Any missing context or uncertainty.
- Present it as a script that clearly distinguishes claims from verified facts.
"""
        else:
            prompt = f"Rewrite the following in a clear, factual reporting style:\n\n{text}"

    # -----------------------------
    # TONE / STYLE MODES
    # -----------------------------
    elif tool == "tone":
        if option == "instructional":
            prompt = f"""
You are creating an instructional / make-aware video script.

Source Material:
{text}

Task:
- Explain the topic clearly and calmly.
- Focus on helping the viewer understand and be aware.
- Use direct, simple language.
- Aim for a 2–3 minute spoken script.
"""
        elif option == "logical-debate":
            prompt = f"""
You are creating a logical, debate-style script.

Source Material:
{text}

Task:
- Present the main argument.
- Present counterpoints or opposing views.
- Use structured reasoning and evidence-based language.
- Avoid insults; focus on logic.
- Aim for a 2–4 minute spoken script.
"""
        elif option == "critical-callout":
            prompt = f"""
You are creating a critical, call-out style script.

Source Material:
{text}

Task:
- Point out problems, inconsistencies, or misleading elements.
- Be firm and direct, but stay grounded in facts.
- Avoid personal attacks; focus on behavior, claims, and impact.
- Aim for a 2–3 minute spoken script.
"""
        elif option == "satirical":
            prompt = f"""
You are creating a satirical, mocking-style script.

Source Material:
{text}

Task:
- Highlight absurdity, hypocrisy, or contradictions using humor and sarcasm.
- Do not fabricate facts; base the satire on what is actually present.
- Keep it sharp but understandable.
- Aim for a 1–3 minute spoken script.
"""
        elif option == "serious-urgent":
            prompt = f"""
You are creating a serious, urgent-tone script.

Source Material:
{text}

Task:
- Emphasize the gravity and importance of the topic.
- Use clear, direct language.
- Avoid sensationalism; let the facts carry the weight.
- Aim for a 2–3 minute spoken script.
"""
        else:
            prompt = f"Rewrite the following in a tone appropriate for a serious, informative video:\n\n{text}"

    # -----------------------------
    # ANALYSIS / PROPAGANDA MODES
    # -----------------------------
    elif tool == "analysis":
        if option == "bias-detection":
            prompt = f"""
You are analyzing the following material for bias.

Source Material:
{text}

Task:
- Identify signs of bias, including:
  - One-sided framing.
  - Loaded or emotional language.
  - Omitted context or missing perspectives.
- Explain how the bias shows up.
- Present the analysis as a clear, structured script.
"""
        elif option == "narrative-analysis":
            prompt = f"""
You are analyzing the narrative being pushed in the following material.

Source Material:
{text}

Task:
- Identify the main story or narrative being presented.
- Explain what message the material is trying to make the viewer believe.
- Note any patterns in framing, repetition, or emotional hooks.
- Present this as a clear, structured breakdown.
"""
        elif option == "motive-breakdown":
            prompt = f"""
You are analyzing possible motives behind the following material.

Source Material:
{text}

Task:
- Consider who benefits if the viewer believes this.
- Identify potential interests, incentives, or agendas.
- Do not invent wild conspiracies; stay within reasonable inference.
- Present the analysis as a script suitable for a 2–3 minute video.
"""
        elif option == "red-flag-detector":
            prompt = f"""
You are scanning the following material for red flags in communication.

Source Material:
{text}

Task:
- Identify manipulation tactics such as:
  - Fear-mongering.
  - Strawman arguments.
  - Cherry-picked data.
  - Overgeneralization.
  - Emotional manipulation.
- Explain each red flag clearly.
"""
        elif option == "source-signals":
            prompt = f"""
You are evaluating the following material for source reliability signals.

Source Material:
{text}

Task:
- Look for:
  - Citations or lack thereof.
  - Specific vs vague claims.
  - Transparency about uncertainty.
  - Use of verifiable data.
- Provide a balanced assessment of reliability signals.
"""
        else:
            prompt = f"Provide a clear, structured analysis of the following material:\n\n{text}"

    # -----------------------------
    # VIDEO SCRIPT MODES
    # -----------------------------
    elif tool == "script":
        if option == "60s":
            prompt = f"""
You are writing a 60-second video script based on the following material.

Source Material:
{text}

Task:
- Create a tight, punchy script that can be spoken in about 60 seconds.
- Focus on 1–3 key points.
- Use direct, engaging language.
"""
        elif option == "2-3min":
            prompt = f"""
You are writing a 2–3 minute video script based on the following material.

Source Material:
{text}

Task:
- Create a structured script with:
  - Hook
  - Context
  - Main points
  - Closing / takeaway
- Use clear, conversational language.
"""
        elif option == "5min-deep-dive":
            prompt = f"""
You are writing a 5-minute deep-dive video script based on the following material.

Source Material:
{text}

Task:
- Create a detailed, structured script with:
  - Hook
  - Background/context
  - Main sections
  - Implications or impact
  - Closing
- Keep it engaging but informative.
"""
        elif option == "conversational":
            prompt = f"""
You are writing a conversational video script based on the following material.

Source Material:
{text}

Task:
- Make it sound like the host is talking directly to the viewer.
- Use natural, spoken language.
- Keep it clear and engaging.
- Aim for a 2–3 minute script.
"""
        elif option == "host-guest-dialogue":
            prompt = f"""
You are writing a host + guest dialogue script based on the following material.

Source Material:
{text}

Task:
- Create a back-and-forth between:
  - HOST: asking questions, guiding.
  - GUEST: explaining, responding.
- Use realistic, engaging dialogue.
- Aim for a 2–4 minute script.
"""
        else:
            prompt = f"Turn the following into a clear, engaging video script:\n\n{text}"

    # -----------------------------
    # ARC‑NEXUS SIGNATURE MODES
    # -----------------------------
    elif tool == "arc_nexus":
        if option == "synthesis":
            prompt = f"""
You are ARC‑NEXUS Synthesis Engine.

Source Material:
{text}

Task:
- Combine all relevant information into one coherent narrative.
- Remove redundancy and contradictions where possible.
- Present a clear, structured explanation suitable for a 2–3 minute video.
"""
        elif option == "deconstruction":
            prompt = f"""
You are ARC‑NEXUS Deconstruction Engine.

Source Material:
{text}

Task:
- Break down the material into:
  - Core claims.
  - Evidence used.
  - Logical structure.
  - Weak points or gaps.
- Present this as a clear, step-by-step deconstruction.
"""
        elif option == "enhancement":
            prompt = f"""
You are ARC‑NEXUS Enhancement Engine.

Source Material:
{text}

Task:
- Rewrite this as a sharp, clear, cyber-intelligent script.
- Improve clarity, flow, and impact.
- Keep the original intent, but make it more powerful and polished.
"""
        elif option == "compression":
            prompt = f"""
You are ARC‑NEXUS Compression Engine.

Source Material:
{text}

Task:
- Compress this into a tight, high-impact script.
- Keep only the most important points.
- Aim for a 1–2 minute spoken script.
"""
        else:
            prompt = f"Rewrite the following in a sharp, clear, ARC‑NEXUS style:\n\n{text}"

    # -----------------------------
    # FALLBACK
    # -----------------------------
    else:
        prompt = f"""
You are ARC‑NEXUS Creation Engine.

Task:
Rewrite and improve the following content for use in a video script.

Source Material:
{text}
"""

    # Call LLM
    output = await run_llm(prompt)
    return {"output": output}
# ---------------------------------------------------------
# TAG GENERATION ENDPOINT
# ---------------------------------------------------------
class TagRequest(BaseModel):
    output: str
    tool: str
    option: str


@router.post("/create/tags")
async def create_tags(payload: TagRequest):
    """
    Generate 5–8 short, relevant tags based on the generated output.
    """

    tag_prompt = f"""
You are ARC‑NEXUS Tag Engine.

Your job:
- Read the generated content below.
- Produce 5–8 short, relevant tags.
- Tags should be 1–3 words each.
- No hashtags, no punctuation, no long phrases.

Content:
{payload.output}

Return ONLY a JSON list of tags, like:
["tag1", "tag2", "tag3"]
"""

    raw = await run_llm(tag_prompt)

    # Try to parse JSON list
    try:
        import json
        tags = json.loads(raw)
        if isinstance(tags, list):
            # Clean tags
            cleaned = [t.strip() for t in tags if isinstance(t, str) and t.strip()]
            return {"tags": cleaned[:8]}
    except:
        pass

    # Fallback: split by commas or newlines
    fallback = [
        t.strip()
        for t in raw.replace("\n", ",").split(",")
        if t.strip()
    ]

    return {"tags": fallback[:8]}
