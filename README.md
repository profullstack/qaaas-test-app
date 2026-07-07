# qaaas-test-app

A deliberately buggy todo app for testing [QAaaS.dev](https://qaaas.dev) and PRaaS (Pull Requests as a Service).

## Quick start

```bash
npm install
npm start
# open http://localhost:3111
```

## Known bugs (for QA agent to find)

This app has **8 intentional bugs** that the QAaaS browser agent should detect and PRaaS should generate fixes for:

| # | Bug | Location | What happens |
|---|-----|----------|--------------|
| 1 | Empty todo submission | `server.js` POST /api/todos | No validation — submitting an empty title creates a blank todo |
| 2 | ID type inconsistency | `server.js` POST /api/todos | ID stored as number but compared as string in some routes |
| 3 | Toggle completion broken | `server.js` PATCH /api/todos/:id/toggle | Strict `===` compares string param to number id — always 404 |
| 4 | Update overwrites todo | `server.js` PUT /api/todos/:id | Replaces entire object instead of merging — loses completed/priority/createdAt |
| 5 | NaN completion rate | `server.js` GET /api/stats | Division by zero when no todos exist — returns NaN |
| 6 | Broken About link | `public/index.html` nav | Links to /about which has no route — serves index.html as fallback |
| 7 | NaN% displayed | `public/index.html` stats | Shows "NaN%" in the UI when stats endpoint returns NaN |
| 8 | No plural for counter | `public/index.html` counter | Always says "X item left" even when X != 1 |

## Deploy

Docker:
```bash
docker build -t qaaas-test-app .
docker run -p 3111:3111 qaaas-test-app
```

Railway: connect this repo and deploy.
