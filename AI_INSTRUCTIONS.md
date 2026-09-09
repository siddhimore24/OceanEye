# AI_INSTRUCTIONS.md

## PROJECT

SIH Oil Spill Attribution — PS ID 26143

## GOAL

Build an evidence-first system:

Satellite imagery
→ oil spill detection
→ spill geometry
→ drift hindcasting
→ source probability zone
→ AIS correlation
→ vessel ranking
→ explainable dashboard

## GENERAL RULES

1. Read this file, ARCHITECTURE.md and DATA_CONTRACTS.md first.
2. Work only on the assigned module unless explicitly asked otherwise.
3. Do not change shared data contracts without approval.
4. Do not invent scientific results or fake real-world evidence.
5. Keep the MVP runnable on the demo laptop.
6. Prefer simple, explainable methods for the MVP.
7. Every module must have testable input/output.
8. Do not add unnecessary dependencies.
9. Clearly label synthetic/demo data.
10. Preserve reproducibility and document assumptions.
11. Never hard-code fake vessel guilt or a fake final conclusion.
12. Treat vessel output as a ranked candidate list, not a guilt declaration.
13. Clearly expose uncertainty and limitations.
14. Before finishing, run relevant tests and report what changed.

## CODE STYLE

- Keep functions modular and readable.
- Use clear names and type hints where practical.
- Add comments for non-obvious scientific logic.
- Do not rewrite unrelated files.
- Avoid breaking existing working functionality.

## MVP PRIORITY

1. End-to-end working pipeline
2. Spill detection / geometry
3. Source probability zone
4. AIS filtering and correlation
5. Explainable vessel ranking
6. Working map/dashboard
7. Failure-case handling
8. Extra features only after the pipeline works