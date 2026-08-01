# F1 Telemetry Dashboard

![WIP Screenshot](docs/Screenshot%202.png)

An F1 telemetry dashboard: browse season → race → driver, play back lap telemetry on a track map, and get AI-generated
coaching feedback on driver mistakes.

**v1 scope:** race sessions only, single-driver playback only.

## Tech Stack

- **Data:** FastF1 (Python)
- **Backend:** Python, FastAPI
- **Database:** SQLite via peewee
- **AI:** OpenAI API (narrative coaching)
- **Frontend:** React + Vite, served by FastAPI
- **Hosting:** one DigitalOcean droplet

## V1 Tasks

**Data**

- [x] Ingestion script: fetch a race session via FastF1
- [x] Parse laps, sector times, per-lap telemetry, driver/team metadata, weather
- [x] Compute delta-to-fastest-lap and cumulative distance per lap
- [x] Write peewee models + SQLite schema
- [x] Make ingestion idempotent (safe to re-run)

**Backend**

- [x] `GET /seasons`, `/races`, `/drivers`, `/laps`
- [x] `GET /races/{id}/laps/{id}/telemetry`
- [x] `GET /races/{id}/results`
- [x] `POST /analysis/{lap_id}`
- [x] Basic error handling

**AI**

- [x] Feature extraction (braking, throttle, corner speed, sector deltas vs. reference lap)
- [x] Structured summary builder
- [x] OpenAI API integration for narrative feedback
- [x] Cache results in SQLite (`ai_coaching_cache`)
- [x] Fallback UI state if AI call fails

**Frontend**

- [x] Season/race/session/driver selectors
- [x] Lap list view
- [x] Static telemetry charts (speed/throttle/brake)
- [x] Track map from X/Y telemetry
- [x] Client-side playback (fetch once, animate via `requestAnimationFrame`)
- [ ] AI coaching feedback panel
- [x] Loading/error states

**Deploy**

- [ ] Provision DigitalOcean droplet
- [ ] Deploy FastAPI + SQLite + built frontend as one process
- [ ] Env vars / secrets configured (Claude API key server-side only)

## Status

- Planning complete.
- Backend implemented.
- Frontend almost completed.
- AI integration pending.
