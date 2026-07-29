---
name: Replit lockfile proxy corruption
description: npm install inside Replit bakes an internal proxy hostname into package-lock.json that breaks any external CI/CD (Vercel, GitHub Actions, etc.)
---

# Replit package-lock.json Proxy Corruption

## The Rule
After every `npm install`, `npm update`, or `npm add` inside Replit, run:
```bash
npm run fix-lockfile
git add package-lock.json
```
before committing, or Vercel (and any other external CI) will fail during dependency installation.

**Why:** Replit intercepts all npm traffic at the network level and routes it through an internal proxy: `http://package-firewall.replit.local/npm/`. This hostname gets written into `package-lock.json` as the `resolved` field for each package. That URL is only reachable inside Replit's own network — not from Vercel, GitHub Actions, or any external build runner.

**Symptom on Vercel:**
```
npm ERR! Exit handler never called!
```
npm hangs indefinitely waiting for TCP connections to `package-firewall.replit.local` that never complete, then times out with this cryptic error.

**How to apply:** The `fix-lockfile` npm script does a sed in-place replacement:
```
http://package-firewall.replit.local/npm/ → https://registry.npmjs.org/
```
Only the `resolved` URL is changed. Package names, versions, and SHA-512 integrity hashes are untouched and remain valid (Replit's proxy serves identical tarballs to the public registry).

**Why integrity hashes stay valid:** SHA-512 integrity hashes in the lockfile are computed over the tarball content, not the URL. Replit's proxy is a transparent cache of the public npm registry, so the bits are identical.
