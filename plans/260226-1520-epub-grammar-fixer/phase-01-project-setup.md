---
phase: 1
title: "Project Setup"
status: pending
priority: P1
effort: 30m
---

# Phase 1 — Project Setup

## Overview

Bootstrap the TypeScript project: `package.json`, `tsconfig.json`, install deps.

## Files to Create

- `package.json`
- `tsconfig.json`

## Implementation Steps

1. Create `package.json`:
```json
{
  "name": "limae",
  "version": "1.0.0",
  "type": "commonjs",
  "scripts": {
    "fix-grammar": "tsx src/fix-grammar.ts"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "cheerio": "^1.0.0",
    "jszip": "^3.10.1"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

2. Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

3. Run `npm install`

## Todo

- [ ] Create `package.json`
- [ ] Create `tsconfig.json`
- [ ] Run `npm install`

## Success Criteria

- `node_modules` populated
- `npx tsx --version` works
- `@anthropic-ai/sdk`, `jszip`, `cheerio` are importable
