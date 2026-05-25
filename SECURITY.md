# Security Policy

## Reporting a vulnerability

PawCook is a client-side web app — there's no PawCook server holding user
data. Plans, pet profiles, and preferences live in the user's own
browser (localStorage). That bounds the threat surface to:

- XSS / DOM-injection in the web app.
- Dependency vulnerabilities (npm / pnpm packages).
- Privacy regressions (e.g. accidentally exfiltrating user data to a
  third-party).
- Build / deploy pipeline issues.

If you find something in any of those categories, **please report it
privately first** — don't open a public issue.

**Preferred:** open a private security advisory via GitHub
[Security → Advisories → New draft](https://github.com/SirAllap/pawcook/security/advisories/new).

**Alternative:** email `david.pallares@smith.ai` with `[pawcook
security]` in the subject. Expect an initial response within a few
business days.

## What we'll do

1. Confirm the report and assess severity.
2. Reproduce the issue and identify the fix.
3. Coordinate a release of the fix.
4. Credit you in the release notes (unless you'd prefer not to be
   named).

## Out of scope

- **Nutritional accuracy questions.** Those aren't security issues —
  use the "Nutritional concern" issue template instead.
- **Findings from automated scanners** without a working exploit or
  a plausible attack scenario.
- Reports on **the user-supplied data itself** — owners can type any
  weight, allergy, or condition into the app; the app trusts its own
  local UI as the source of truth.

## Supported versions

PawCook ships from `main`. Security fixes land on `main` and are
deployed at next release. There are no LTS branches.
