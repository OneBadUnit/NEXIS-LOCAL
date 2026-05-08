# NEXIS — KNOWN ISSUES / ACTIVE TECHNICAL NOTES

## Purpose

This file tracks:
- active bugs
- confirmed technical concerns
- accepted MVP limitations
- deferred architectural decisions
- fragile flows requiring careful review
- areas AI should avoid repeatedly suggesting

This file is:
- practical development memory
- MVP-focused guidance
- a current-state technical reference

This file is NOT:
- a formal bug tracker
- a conversation transcript
- an AI behavior training log
- a session summary archive

Those belong in:
- AI_BEHAVIOR_EXAMPLES.md
- SESSION_NOTES.md

---

# CURRENT PROJECT STAGE

NEXIS is currently focused on:
- MVP stabilization
- onboarding refinement
- authentication stabilization
- local AI workflow integration

Priority order:
1. stable workflows
2. maintainable code
3. predictable behavior
4. shipping usable features

Not currently prioritized:
- enterprise scalability
- theoretical perfection
- premature optimization

---

# DEVELOPMENT PHILOSOPHY

NEXIS is intentionally built around:
- practical engineering
- iterative refinement
- controlled complexity
- human-reviewed AI assistance
- local-first architecture where practical

Recommendations should align with this philosophy.

---

# KNOWN ACCEPTED LIMITATIONS

## Accessibility Refinement
Status: Accepted for MVP

Current accessibility is functional but not fully polished.

Avoid repeatedly recommending:
- enterprise accessibility audits
- large accessibility refactors
- accessibility frameworks

Allowed:
- minimal ARIA improvements
- targeted accessibility fixes

---

## Inline Styling
Status: Accepted for MVP

Some components intentionally use inline styles for:
- iteration speed
- readability
- localized control

Avoid repeatedly recommending:
- styled-components
- Emotion
- CSS-in-JS migrations
- unnecessary styling abstractions

Only suggest refactors if:
- duplication becomes excessive
- maintainability significantly degrades
- theming becomes difficult

---

## No Global State Management
Status: Intentional

Large state-management systems are intentionally avoided during MVP stage.

Avoid repeatedly recommending:
- Redux
- Zustand
- MobX
- large state architecture changes

Preferred:
- local state
- simple prop flow
- minimal complexity

---

## AI-Assisted Development Workflow
Status: Active

AI-generated code is always human reviewed before application.

Workflow:
1. review first
2. apply manually
3. validate behavior
4. commit after verification

Do not assume autonomous edits are allowed.

---

## Local-First Philosophy
Status: Intentional

NEXIS prefers:
- local processing
- controllable systems
- minimal cloud dependency when practical

Avoid repeatedly recommending:
- cloud-only architectures
- SaaS-heavy dependencies
- unnecessary hosted infrastructure

---

# KNOWN FRAGILE AREAS

## Startup / Overlay Flow
Status: Under Review

Current flow includes:
- LogoOverlay
- OnboardingOverlay
- ArcNexusApp

Potential fragility:
- transition timing
- overlay sequencing
- onboarding visibility state
- timeout cleanup behavior

Review guidance:
- prefer bounded targeted validation
- avoid broad rewrites
- prefer minimal safe fixes
- preserve working startup behavior

### Confirmed Findings
- OnboardingOverlay required safer localStorage handling
- LogoOverlay timer cleanup required verification

### Approved Improvements
- localStorage try/catch protection
- minimal ARIA improvements
- timer cleanup validation

### Deferred / Requires Additional Evidence
- ArcNexusApp stale ref concerns
- broader startup flow refactors
- global onboarding state redesign

---

## localStorage Usage
Status: Improving

Some onboarding/configuration state still uses direct localStorage access.

Known concerns:
- restricted browser environments
- potential SecurityError exceptions
- fragile persistence assumptions

Preferred approach:
- lightweight wrapper logic
- minimal try/catch protection
- preserve current architecture

Avoid:
- IndexedDB migrations
- persistence rewrites
- backend persistence redesign

---

# PLATFORM SCOPE RULES

- Always respect requested platform scope
- React/web frontend reviews must remain within frontend scope unless explicitly expanded
- Do not include Android, Kotlin, Java, backend, or infrastructure unless explicitly approved
- Candidate files must be justified by exact references, not naming similarity
- Do not infer architecture from filenames alone

---

# REVIEW PRIORITIES

AI reviews should prioritize:
1. real bugs
2. runtime stability
3. user-facing breakage
4. maintainability problems
5. confusing logic
6. fragile flows

Lower priority:
- theoretical scalability
- textbook best practices
- stylistic purity
- enterprise architecture

---

# DO NOT REPEATEDLY SUGGEST

Unless directly relevant and justified:
- Redux
- CSS-in-JS
- TypeScript migration
- microservice architecture
- advanced state management
- enterprise authentication redesign
- large UI framework rewrites
- aggressive folder restructuring
- premature optimization
- broad component abstraction