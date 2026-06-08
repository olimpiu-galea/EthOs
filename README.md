# SignalRelay

Turn live **signals** into playbooks, alerts, and guided action. Cross-industry operations platform — manufacturing, regulated production, and more. Frontend-only mock integration today (DCS nine-field template); designed for additional sources (inventory, market) later.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run test    # rule evaluator unit tests
npm run build   # production build
```

## Pages

- **Home** — Product overview, flow diagrams, AI performance insights (coming soon)
- **Integrations** — Signal sources (DCS mock today), live signal table, KPIs
- **Playbooks** — Create, edit, activate playbooks; flat conditions with ALL/ANY matching
- **Agenda** — Today’s alert timeline (completed = past, active = recent)
- **Operations suite** — DCS overview, Batches, Reports (coming soon)

## Demo timeline data

- `public/fixtures/dcs-tags.csv` — current snapshot (9-column DCS template)
- `public/fixtures/dcs-tags-timeline.json` — minute-by-minute values for today + yesterday

Regenerate timeline after CSV changes:

```bash
npm run generate:timeline
```

## DCS data contract

All tag data uses exactly these fields (CSV header must match):

`id,value,name,desc,category,fieldType,frequency,displayLabel,unit`

Replace the fixture at `public/fixtures/dcs-tags.csv`. The parser rejects invalid headers or row column counts.

## Mock connection

1. **Connect** loads the CSV and starts a 60-second refresh (values jitter for demo).
2. **Disconnect** clears all tag data from the app.
3. Per-tag value buffers are kept client-side for windowed rule evaluation.

## Playbook evaluation

On each sync (including initial connect):

1. Skip playbooks with status `disabled`.
2. Evaluate **conditions** (flat list): match **ALL** or **ANY** per playbook setting.
3. If true, show a toast (5-minute cooldown per playbook).

### Rule features

- Operators: `>`, `<`, `>=`, `<=`, `==`, `!=`
- Optional **duration** (`min` / `h`) with `instant` meaning all points in the window must satisfy the comparison
- **Aggregation**: `avg`, `max`, `min` over the duration window
- Tag `frequency` (`1min`, `5min`, `1h`) informs buffer retention

## Persistence

Playbooks are stored in `localStorage` under `playbook-editor-playbooks`.

## Tech stack

Next.js 15, TypeScript, Tailwind CSS, shadcn-style UI primitives, Zustand.
