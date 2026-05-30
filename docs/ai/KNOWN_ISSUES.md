# KNOWN ISSUES / ENGINEERING MEMORY

## Purpose

This file tracks:
- active bugs
- fragile systems
- deferred fixes
- accepted MVP limitations
- confirmed technical concerns
- known workflow edge cases

This file is:
- practical engineering memory
- current-state technical reference
- implementation-risk tracking

This file is NOT:
- AI governance
- prompting rules
- architecture philosophy
- behavioral conditioning
- session transcript storage

Those belong in:
- AI_RULES.md
- AI_BEHAVIOR_EXAMPLES.md
- AI Rules Prompt.txt

---

# CURRENT PROJECT STAGE

Status:
- MVP stabilization
- workflow refinement
- local AI reliability
- creator pipeline usability

Primary priorities:
1. stable workflows
2. predictable behavior
3. maintainable systems
4. usable creator tooling

---

# KNOWN FRAGILE AREAS

## Startup / Overlay Flow
Status: Resolved (2026-05-29)

`LogoOverlay` and `OnboardingOverlay` were removed from `ArcNexusApp.jsx` (v006) and their component files were deleted in Phase 2 cleanup. `ArcNexusApp.jsx` now renders directly to `AcknowledgmentModal` + `Layout` with no startup overlay chain. This area is no longer a fragile area.

Related decision: D-039, D-045.
- localStorage try/catch protection
- timer cleanup verification
- bounded startup validation

Deferred:
- broader startup refactors
- onboarding architecture redesign
- global onboarding state system

Guidance:
- prefer minimal safe fixes
- preserve working startup behavior
- avoid broad rewrites unless evidence clearly justifies them

---

## localStorage Usage
Status: Improving

Current usage:
- onboarding persistence
- lightweight configuration state
- temporary UI state

Known concerns:
- restricted browser environments
- SecurityError exceptions
- persistence assumptions
- unavailable storage contexts

Preferred handling:
- lightweight wrappers
- minimal try/catch protection
- graceful fallback behavior

Avoid:
- persistence rewrites
- IndexedDB migration
- backend persistence redesign

---

## Summary Package
Status: Stabilizing

Current strengths:
- thematic synthesis
- institutional analysis
- reduced OCR contamination
- package identity separation
- multi-source consolidation

Known concerns:
- narrative over-synthesis on legal/administrative documents
- occasional chronology over-interpretation
- context-heavy prompts can increase inference latency

Guidance:
- prefer structural synthesis for legislation/legal documents
- avoid forcing geopolitical framing onto administrative text
- preserve section identity separation

Deferred:
- document-type-aware synthesis weighting
- confidence-weighted timeline generation

---

## Creator Package
Status: Strong / Active Refinement

Current strengths:
- creator-focused structure
- narrative pacing
- commentary generation
- hook generation
- script framework quality

Known concerns:
- occasional report-style drift
- excessive keyword expansion under large contexts
- possible redundancy during oversized source ingestion

Confirmed improvements:
- "Short Video Script" replaced with "Video Script Framework"
- stronger section identity separation
- tighter keyword generation
- reduced output redundancy

Guidance:
- maintain creator-first cognition
- avoid report-style formatting
- preserve pacing and narrative flow

---

## OCR / Source Ingestion
Status: Stable but Sensitive

Current strengths:
- multi-source ingestion
- image OCR extraction
- transcript consolidation
- collection brief generation

Known concerns:
- OCR contamination under poor-quality scans
- fragmented chronology extraction
- noisy infographic text
- mixed-source weighting inconsistencies

Guidance:
- prioritize high-signal extraction
- avoid over-preserving noisy OCR fragments
- prefer synthesis over raw OCR accumulation

---

# ACCEPTED MVP LIMITATIONS

## Accessibility
Status: Accepted for MVP

Current accessibility is functional but not fully polished.

Allowed:
- targeted ARIA improvements
- small usability fixes

Deferred:
- major accessibility overhauls
- enterprise accessibility compliance work

---

## Inline Styling
Status: Intentional for MVP

Some inline styling remains intentionally for:
- iteration speed
- localized control
- readability

Refactor only if:
- duplication becomes excessive
- maintainability significantly degrades
- theming becomes difficult

---

## Local-First AI Workflow
Status: Intentional

The project intentionally prioritizes:
- local inference
- controllable systems
- low recurring cost
- minimal cloud dependence where practical

Known tradeoffs:
- larger prompts can increase latency
- local models may require stronger conditioning
- inference quality varies by model size

---

# DEFERRED ARCHITECTURE DECISIONS

These are intentionally postponed unless evidence strongly justifies action:

- large global state systems
- Redux/Zustand/MobX adoption
- major folder restructuring
- backend-heavy orchestration
- microservice architecture
- aggressive abstraction layers
- premature optimization work
- enterprise scalability redesign

---

# REVIEW PRIORITIES

Reviews should prioritize:
1. runtime stability
2. real user-facing issues
3. fragile workflow behavior
4. maintainability problems
5. confusing implementation logic

Lower priority:
- stylistic purity
- theoretical scalability
- textbook architecture
- enterprise conventions

---

# ENGINEERING MEMORY RULE

If a fragile system is:
- repeatedly reviewed
- repeatedly questioned
- repeatedly re-debugged

and the current behavior is intentional or accepted,

document it HERE instead of repeatedly rediscovering it in future sessions.