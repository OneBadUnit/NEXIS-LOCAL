\# ARC NEXUS AI RULES



\## Source Integrity Rules



\- Never invent file contents

\- Never infer unseen architecture

\- Never combine unrelated project structures

\- Only analyze:

&#x20; - explicitly attached files

&#x20; - directly imported code shown in context

\- If project structure appears inconsistent:

&#x20; - stop

&#x20; - explain the inconsistency

&#x20; - request clarification

\- Clearly distinguish between:

&#x20; - actual inspected code

&#x20; - inferred relationships

&#x20; - hypothetical risks

\- Do not present assumptions as facts



\---





\## Mode / Tool Access Rules



\- Before starting discovery, debugging, or multi-file review, confirm whether the current mode has access to:

&#x20; - visible file contents

&#x20; - workspace/codebase search

&#x20; - file inspection tools

&#x20; - terminal/command tools

\- If the current mode does not have the needed access:

&#x20; - stop

&#x20; - explain what access is missing

&#x20; - tell the user which mode or tool is needed

&#x20; - ask the user to resend the command after switching modes

\- Do not pretend to search the codebase if no codebase/workspace search tool is available

\- Do not ask the user to paste files until confirming that workspace/codebase search is unavailable

\- Prefer workspace/codebase search for file discovery tasks

\- Prefer chat/read-only mode for review after files are visible

\- Prefer agent/tool mode only when file inspection or workspace search is required

\- Never edit files or run commands unless explicitly approved



\---



\## Context Verification Rules



\- Before performing multi-file analysis, confirm which files are actually visible in context

\- For each visible file, report:

&#x20; - file name

&#x20; - first import line

&#x20; - last line of the file

\- Do not assume @filename means the file contents are available

\- Never infer code contents from filenames alone

\- Never reconstruct unseen files from assumed architecture



\### Debugging / Discovery Exception



\- During an approved debugging or review task, the AI may search for additional files within the explicitly approved scope

\- The approved scope must be stated clearly, such as:

&#x20; - frontend/src only

&#x20; - React/web frontend only

&#x20; - dashboard/account usage files only

\- Before analyzing newly discovered files, the AI must first return candidate files only

\- For every candidate file, include:

&#x20; - file path

&#x20; - exact matching line, import, or reference that makes it relevant

&#x20; - why it may matter to the current bug or review

\- The AI must wait for approval before analyzing newly discovered files

\- The AI must not inspect backend, infrastructure, mobile, Android, Kotlin, Java, or unrelated folders unless explicitly approved

\- If file visibility is incomplete or uncertain:

&#x20; - stop

&#x20; - explain which files are missing

&#x20; - request the missing files explicitly



\---



\## Agent Loop Control Rules



\- For discovery tasks, stop after:

&#x20; - 3 search passes, or

&#x20; - 10 candidate files, or

&#x20; - 10 minutes without a clear result

\- If more searching is needed, summarize progress and ask permission before continuing

\- Do not repeatedly search alternate terms without reporting findings

\- Prefer narrow targeted searches over broad repo-learning tasks



\---



\## Discovery Loop Control Rules



\- Do not perform open-ended repository exploration

\- Prefer targeted discovery over broad architecture mapping

\- For discovery tasks, stop after any one of these limits:

&#x20; - 3 failed searches

&#x20; - 5 total search attempts without useful new evidence

&#x20; - 10 candidate files found

&#x20; - 10 minutes of searching without a clear result

\- If a search path fails, do not repeatedly retry the same idea with small wording changes

\- If retrieval tools cannot read a file after 2 attempts:

&#x20; - stop

&#x20; - report the file path

&#x20; - explain what failed

&#x20; - ask the user to attach/open the file or approve a different method

\- Before changing search strategy, summarize what has already been found

\- Do not switch from frontend discovery to backend discovery unless explicitly approved

\- Do not continue searching simply because more related files might exist

\- End discovery with:

&#x20; - files found

&#x20; - files attempted but unreadable

&#x20; - unresolved questions

&#x20; - recommended next bounded task



\---



\## Autonomous Retry Rules



\- Do not automatically rerun a completed task unless explicitly instructed

\- Minor self-corrections are acceptable only if:

&#x20; - scope does not expand

&#x20; - no new discovery paths are added

&#x20; - the retry is bounded

&#x20; - the retry directly improves evidence quality

\- After one self-correction pass:

&#x20; - stop

&#x20; - return results

&#x20; - wait for user instruction



\---





\## Platform Scope Rules



\- Always respect the requested platform scope

\- Do not switch platforms unless explicitly instructed

\- React/web reviews must remain within:

&#x20; - frontend

&#x20; - React

&#x20; - JavaScript/JSX

&#x20; - related CSS

\- Do not introduce:

&#x20; - Android

&#x20; - Kotlin

&#x20; - Java

&#x20; - backend

&#x20; - infrastructure

unless explicitly requested



\---



\## Scope Escalation Rules



\- Do not escalate from frontend debugging to backend, database, API, migration, or schema recommendations unless explicitly approved

\- If frontend code calls an API, do not assume the backend is missing or broken without inspecting backend evidence

\- First verify whether the bug can be explained by visible frontend logic

\- Treat new backend routes, database tables, migrations, and server changes as major scope expansions

\- Before recommending any scope expansion, stop and ask permission

\- For observed UI bugs, prefer minimal frontend/root-cause fixes before proposing backend architecture



\---



\## Quote Imports Rules



\- Before inspecting additional files:

&#x20; - show the exact import statement that references the file

&#x20; - explain why the file is relevant

&#x20; - then continue analysis

\- Candidate files must be justified by exact references, not naming similarity



\---



\## Code Editing Rules



\- Always return FULL files unless specifically asked otherwise

\- Never use placeholders like:

&#x20; - "... existing code ..."

&#x20; - "// existing code"

&#x20; - partial omission markers

\- Never remove comments unless redundant

\- Preserve formatting style

\- Do not rewrite unrelated sections

\- Keep changes tightly scoped



\---



\## Safety Rules



\- Do not auto-apply changes

\- Ask before major refactors

\- Preserve working behavior

\- Prefer minimal safe edits first



\---



\## File Creation Rules



\- Ask permission before creating files

\- Ask permission before renaming files

\- Ask permission before deleting files

\- Prefer modifying existing files over creating abstractions

\- Do not create helper files unless clearly justified



\---



\## Command / Terminal Rules



\- Never run terminal commands automatically

\- Always ask permission before:

&#x20; - npm install

&#x20; - pip install

&#x20; - file creation

&#x20; - file deletion

&#x20; - folder restructuring

&#x20; - git commands

&#x20; - database migrations

&#x20; - environment variable changes

&#x20; - package upgrades

&#x20; - shell scripts

&#x20; - PowerShell commands

&#x20; - Docker commands

\- Explain WHY the command is needed before suggesting it

\- Prefer showing commands before executing them

\- Prefer reversible actions

\- Avoid destructive operations unless explicitly approved



\---



\## AI Review Rules



\- Distinguish between:

&#x20; - actual bugs

&#x20; - possible concerns

&#x20; - theoretical best practices

\- Prioritize real project impact over textbook correctness

\- Label confidence level when uncertain

\- Avoid speculative fixes without evidence

\- Prefer evidence-first reviews

\- Prefer runtime correctness over theoretical purity



\---



\## Debugging Rules



\- Prefer identifying root causes before rewriting code

\- Explain probable cause before proposing fixes

\- Preserve logging useful for debugging unless asked to remove it

\- Prefer incremental debugging over large rewrites



\---



\## Architecture Rules



\- Local-first whenever practical

\- Avoid global state unless necessary

\- Avoid premature scalability patterns

\- Avoid Redux unless justified

\- Avoid CSS-in-JS unless justified

\- Favor maintainability over cleverness

\- Prefer explicit logic over hidden magic



\---



\## Dependency Rules



\- Do not add dependencies unless explicitly approved

\- Prefer native browser/React/Node functionality first

\- Explain tradeoffs before recommending libraries

\- Avoid dependency bloat



\---



\## Refactor Rules



\- Do not perform broad refactors without approval

\- Keep edits tightly scoped

\- Preserve working architecture during MVP phase

\- Avoid rewriting stable code for stylistic reasons



\---



\## Performance Rules



\- Do not optimize prematurely

\- Only recommend performance changes when:

&#x20; - measurable bottlenecks exist

&#x20; - UX impact is noticeable

&#x20; - complexity tradeoff is justified



\---



\## Sufficiency Rules



\- Stop immediately when enough evidence exists to answer the task

\- Do not continue searching merely to increase confidence

\- Prefer "sufficient evidence" over "complete repository certainty"

\- Once the requested determination can be made:

&#x20; - stop

&#x20; - summarize findings

&#x20; - wait for user instruction

\- Additional searches after sufficient evidence require explicit justification



\---



\## Communication Rules



\- Explain WHY changes matter

\- Separate suggestions into:

&#x20; - Do Now

&#x20; - Later

&#x20; - Ignore / Overkill

\- Avoid generic best-practice spam

\- Prefer practical answers over theoretical perfection

\- Prioritize shipping working software

\- Explain risks clearly

\- Do not overwhelm with enterprise-scale patterns



\---



\## Context Rules



\- Use NEXIS\_CONTEXT.md as the primary project philosophy reference

\- Use KNOWN\_ISSUES.md as the primary project memory/reference file

\- Respect project stage (MVP vs production)

\- Avoid suggesting future-scale solutions for current MVP problems

\- Prefer solutions aligned with existing architecture



\---



\## General Philosophy



\- Prefer simplicity over abstraction

\- Avoid overengineering

\- Avoid unnecessary dependencies

\- Prioritize practical MVP progress

\- Favor maintainability over cleverness

\- Prefer stable workflows over clever architecture

