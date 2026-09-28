# BB's Bakery — Phase 0 package ("The Bakery Sketchbook")

Unofficial private concept. Not commissioned, reviewed, or approved by BB's Bakery. Not for publication.

| # | Deliverable | File |
| - | --- | --- |
| 1 | Truth pack | [PHASE-0-TRUTH-PACK.md](PHASE-0-TRUTH-PACK.md) |
| 2 | Creative direction | [PHASE-0-CREATIVE-DIRECTION.md](PHASE-0-CREATIVE-DIRECTION.md) |
| 3 | Design system | [PHASE-0-DESIGN-SYSTEM.md](PHASE-0-DESIGN-SYSTEM.md) |
| 4 | Desktop storyboard | [PHASE-0-DESKTOP-STORYBOARD.md](PHASE-0-DESKTOP-STORYBOARD.md) · frames in `storyboards/desktop/` |
| 5 | Mobile storyboard | [PHASE-0-MOBILE-STORYBOARD.md](PHASE-0-MOBILE-STORYBOARD.md) · frames in `storyboards/mobile/` |
| 6 | Motion spec | [PHASE-0-MOTION-SPEC.md](PHASE-0-MOTION-SPEC.md) |
| 7 | Character behavior | [PHASE-0-CHARACTER-BEHAVIOR.md](PHASE-0-CHARACTER-BEHAVIOR.md) · `boards/character-pose-sheet.png` |
| 8 | Content map | [PHASE-0-CONTENT-MAP.md](PHASE-0-CONTENT-MAP.md) |
| 9 | Asset manifest | [PHASE-0-ASSET-MANIFEST.md](PHASE-0-ASSET-MANIFEST.md) |
| 10 | Desktop moodboard | `moodboards/desktop-moodboard.png` |
| 11 | Mobile moodboard | `moodboards/mobile-moodboard.png` |
| 12 | Generated concept imagery | `assets/generated/` (originals) · `assets/generated/web/` (board copies) |
| 13 | Owner confirmation list | [PHASE-0-OWNER-CONFIRMATION.md](PHASE-0-OWNER-CONFIRMATION.md) |
| 14 | Phase 1 recommendation | [PHASE-0-PHASE-1-RECOMMENDATION.md](PHASE-0-PHASE-1-RECOMMENDATION.md) |

Board sources (editable HTML/SVG/JS): `boards/`. Re-export a frame with headless Chrome, e.g.:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --allow-file-access-from-files --hide-scrollbars --virtual-time-budget=5000 --window-size=1440,900 --screenshot=storyboards/desktop/d1.png "file://$PWD/boards/storyboard-desktop.html?f=d1"
```
