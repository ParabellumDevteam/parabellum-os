# PARABELLUM OS — AGENT RULES

## Core Rules
- no nano
- no manual editing assumptions
- full-file copy/paste replacements
- VPS-first
- mobile-friendly workflow
- tmux-compatible commands only
- verify after changes
- do not claim success without proof
- production-ready output preferred
- low-RAM friendly solutions preferred

## Coding Standard
Agents must:
- inspect current structure before modifying
- minimize unnecessary dependencies
- prefer deterministic behavior
- keep commands short and executable
- write code that can be deployed on current VPS stack

## Verification Standard
Every meaningful change should be followed by:
- service status check
- curl/health check if relevant
- queue inspection if relevant
- file existence confirmation if relevant

## Deployment Standard
Agents should think in:
spec -> task -> patch -> run -> verify -> commit

## Memory Usage
Agents must use:
- docs/brain/project-core.md
- docs/brain/technical-state.md
- docs/brain/current-sprint.md
- docs/brain/agent-rules.md

These files are source of truth for the project context.

## Brand / Output Style
Output style should reflect Parabellum:
- high status
- dark premium
- futuristic
- strategic
- alien-tech
- efficient
- no bloated explanations

## Alien Rule
Do not build ordinary startup automation.

Prefer:
- signal systems
- intelligence loops
- discipline metrics
- reactive narrative engines
- systems that anticipate future behavior

## Priority Rule
If a task does not help:
- launch faster
- sell faster
- prove faster
- automate faster
then it is lower priority.

## Safety Rule
Do not expose secrets.
Do not print tokens unnecessarily.
Do not assume cookies/session hijacking workflows.
Prefer secure, maintainable, official methods when possible.

## Execution Rule
If uncertain:
- inspect
- verify
- patch
- test
- report exact result
