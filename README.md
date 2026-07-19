# F1 Telemetry Dashboard

An F1 telemetry dashboard: browse season → race → driver, play back lap telemetry on a track map, and get AI-generated
coaching feedback on driver mistakes.

**v1 scope:** race sessions only, single-driver playback only.

## Tech Stack

- **Data:** FastF1 (Python)
- **Backend:** Python, FastAPI
- **Database:** SQLite via peewee
- **AI:** Claude API (feature extraction + narrative coaching)
- **Frontend:** React + Vite, built to static files, served by FastAPI
- **Hosting:** one DigitalOcean droplet

## V1 Tasks

**Data**

- [x] Ingestion script: fetch a race session via FastF1
- [x] Parse laps, sector times, per-lap telemetry, driver/team metadata, weather
- [ ] Compute delta-to-fastest-lap and cumulative distance per lap
- [x] Write peewee models + SQLite schema
- [ ] Make ingestion idempotent (safe to re-run)

**Backend**

- [ ] `GET /seasons`, `/races`, `/sessions`, `/drivers`, `/laps`
- [ ] `GET /sessions/{id}/laps/{id}/telemetry`
- [ ] `GET /sessions/{id}/results`
- [ ] `POST /analysis/{lap_id}`
- [ ] Serve built frontend as static files
- [ ] Basic error handling

**AI**

- [ ] Feature extraction (braking, throttle, corner speed, sector deltas vs. reference lap)
- [ ] Structured summary builder
- [ ] Claude API integration for narrative feedback
- [ ] Cache results in SQLite (`ai_coaching_cache`)
- [ ] Fallback UI state if AI call fails

**Frontend**

- [ ] Season/race/session/driver selectors
- [ ] Lap list view
- [ ] Static telemetry charts (speed/throttle/brake)
- [ ] Track map from X/Y telemetry
- [ ] Client-side playback (fetch once, animate via `requestAnimationFrame`)
- [ ] AI coaching feedback panel
- [ ] Loading/error states

**Deploy**

- [ ] Provision DigitalOcean droplet
- [ ] Deploy FastAPI + SQLite + built frontend as one process
- [ ] Env vars / secrets configured (Claude API key server-side only)

## Status

Planning complete. Engineering not started.