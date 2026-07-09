# qaaas-test-app

A deliberately buggy todo app for testing [QAaaS.dev](https://qaaas.dev) and PRaaS (Pull Requests as a Service).

## Quick start

```bash
npm install
npm start
# open http://localhost:3111
```

## Fixed bugs

All 8 intentional bugs have been fixed in [PR #1](https://github.com/profullstack/qaaas-test-app/pull/1).

## Deploy

Docker:
```bash
docker build -t qaaas-test-app .
docker run -p 3111:3111 qaaas-test-app
```

Railway: connect this repo and deploy.
