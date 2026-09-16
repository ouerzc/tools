# Multi-JSON Diff Implementation Plan

**Goal:** Support two to five JSON inputs, comparing each subsequent input against JSON 1.
**Architecture:** Store independent input text, validation and history selection in a keyed array. Reuse buildDiffViewModel for each baseline/target pair; show and copy labeled result groups. Preserve the existing first-two-input IDs and copy labels for compatibility.
**Tech Stack:** Vue 3, TypeScript, vue-i18n, Vitest/jsdom.

User approved the baseline comparison design. Work in the current workspace to preserve the existing uncommitted history feature.

- [x] Add component interaction tests in tests/devkit.test.ts for five-input limit, removal preserving remaining values, baseline results, invalid input, and history/copy on added inputs. Run npm test and confirm the missing add action fails.
- [x] Refactor src/components/tools/JsonDiffTool.vue to a keyed input array and labeled pair results. Invalidate stale results on edits, history changes, addition and removal. Keep at least two inputs and cap at five.
- [x] Add Chinese/English strings in src/i18n/messages.ts. Extend src/styles/app.css with horizontal scrolling for three or more inputs and wrapping panel actions.
- [x] Run npm test and npm run build. Review git diff for unintended changes and record completion.

Validation: 46 Vitest tests pass, production build passes. Real browser verified five columns, four baseline result groups, disabled add at the limit, focus on the new input, and no page overflow at desktop and 390px viewport widths.
