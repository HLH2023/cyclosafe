# Repository Guidelines

使用简体中文回复


## Project Structure & Module Organization
Front-end UniApp code lives at the repo root: `App.vue`, `main.js`, and `pages/` drive mini-program flows, while `components/` and `composables/` store reusable UI and Composition API helpers. State sits in `store/`, persistence utilities in `db/` and `utils/`, styling in `styles/` + `uni.scss`, and shared assets in `static/`. The FastAPI backend resides in `backend/`, housing API entry points, `training/`, `models/`, and operational scripts such as `start.sh` and `requirements.txt`. Product docs and progress logs are maintained under `docs/`.

## Build, Test, and Development Commands
Front-end development runs through HBuilderX: import the project, then use `运行 -> 运行到小程序模拟器 -> 微信开发者工具`. The npm scripts simply remind you of this workflow. Backend setup: `cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt`. Start the API with `uvicorn main:app --reload --port 8000`. Retrain models via `python training/train_model.py` and sanity-check data ingestion with `python test_data_upload.py` once the server is up.

## Coding Style & Naming Conventions
Vue files use two-space indentation, Composition API patterns, and kebab-case filenames (`components/line-chart/line-chart.vue`) with PascalCase component names. Pinia stores follow the `useThingStore` naming, and composables stay prefixed with `use`. Keep SCSS scoped to components unless styles naturally belong in `styles/`. Python code follows PEP 8: four-space indent, snake_case functions, explicit type hints, and structured logging via `logging.getLogger`.

## Testing Guidelines
Front-end features currently rely on manual verification in the WeChat Developer Tools; document significant findings in `docs/00-进度跟踪.md`. Backend changes should ship with `pytest` cases under a future `backend/tests/` directory when feasible. Until then, run `python test_data_upload.py` against a live API, plus targeted unit tests for any new training utilities, and note command outputs in review threads.

## Commit & Pull Request Guidelines
Commit history follows `type(scope): subject` (e.g., `feat(analysis): 优化刻度计算`). Keep subjects under 70 characters and describe intent. Pull requests must include a summary, linked issue or doc reference, test results (commands, screenshots for UI), and highlight cross-layer impacts. Request review only after local lint/build steps and backend scripts succeed.

## Configuration & Secrets
Store backend secrets in `backend/.env` (`DATABASE_URL`, `ADMIN_API_KEY`); never commit real credentials. Map keys belong in `config/map.config.js`, with sample values mirrored in `map.config.example.js`. Update `manifest.json` for AppID changes and flag doc owners when introducing new environment variables or configuration files.
