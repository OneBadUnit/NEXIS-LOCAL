\# AI WORKFLOW EXAMPLES



\## GOOD: Bounded Discovery



\### Situation

Dashboard usage totals investigation.



\### Correct Behavior

\- Used provided project tree

\- Limited searches to frontend/src

\- Performed 3 searches total

\- Avoided backend exploration

\- Stopped after sufficient evidence



\### Why This Was Good

\- Reduced retrieval loops

\- Preserved GPU/resources

\- Stayed within scope

\- Produced actionable evidence quickly



\### Preferred Pattern

Tree guidance → targeted search → evidence → stop



\---



\## BAD: Recursive Repo Exploration



\### Situation

Attempted full architecture familiarization.



\### Incorrect Behavior

\- Repeated grep searches

\- Expanded from frontend into backend

\- Repeated failed discovery attempts

\- Continued searching after evidence gap identified



\### Why This Was Bad

\- Wasted compute

\- Increased hallucination risk

\- Produced diminishing returns

\- Violated bounded discovery workflow



\### Corrected Pattern

Stop after failed bounded searches and report gap



\---



\## GOOD: Tree-Guided Bounded Discovery With Exact Evidence



\### Situation

Testing whether Deep could use the provided NEXIS project tree without entering a discovery loop.



\### Correct Behavior

\- Performed only 3 searches

\- Stayed inside `frontend/src`

\- Avoided backend exploration

\- Avoided repeated alternate search terms

\- Used the project tree to target likely files

\- Reported exact matching lines

\- Stopped after sufficient evidence



\### Why This Was Good

\- Reduced wasted search/tool cycles

\- Preserved local system resources

\- Avoided hallucinated architecture

\- Produced verifiable evidence

\- Followed bounded discovery rules



\### Preferred Pattern

Project tree → targeted search → exact line evidence → stop



\---



\## GOOD: Post-Task Termination Awareness



\### Situation

Frontend usage aggregation validation task.



Goal was to determine whether dashboard/account totals were:

\- account-wide aggregates

OR

\- project-scoped values



The task required:

\- bounded frontend discovery

\- exact evidence

\- limited searches

\- no backend exploration



\### Correct Behavior

\- Distinguished confirmed vs unconfirmed findings

\- Identified exact locations of:

&#x20; - `syncUsage`

&#x20; - `countAllRawItems`

&#x20; - `countAllOutputs`

&#x20; - `usage.current.\*`

\- Recognized repetitive search behavior

\- Explicitly acknowledged overlapping grep retries

\- Identified the earlier sufficient stopping point

\- Explained why continued searching was unnecessary



\### Important Self-Correction

The model correctly concluded:



> "Stop after first two grep searches"



because sufficient evidence already existed to:

\- confirm project-scoped sync inputs

\- confirm dashboard usage display

\- confirm multiple sync paths



\### Why This Was Good

\- Demonstrated evidence sufficiency awareness

\- Distinguished:

&#x20; - confirmed evidence

&#x20; - unconfirmed assumptions

\- Admitted inefficient search behavior honestly

\- Improved termination awareness

\- Reduced hallucination risk

\- Preserved scope discipline



\### Remaining Weakness Identified

\- Continued searching after sufficient evidence existed

\- Repeated alternate grep patterns unnecessarily

\- Sought additional confidence instead of stopping



\### Preferred Pattern

Targeted search → sufficient evidence → stop immediately



NOT:



Targeted search → repeated confirmation searches → delayed stopping

