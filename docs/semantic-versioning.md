# Semantic Versioning and Release Guide

Rescuenect uses semantic versioning for both the frontend app and the mobile app.
The current baseline version is `2.0.0`.

## Version Sources

The frontend version lives in:

```text
Frontend/package.json
```

The mobile version lives in:

```text
mobile/client/package.json
```

The Expo app config reads from `mobile/client/package.json`, so do not hardcode a separate version in `mobile/client/app.config.ts`.

For native mobile builds, Expo uses the clean base version. For example, if the package version is `2.1.0-staging.1`, the native Expo app version is `2.1.0`, and the full release version is available in Expo config as `extra.releaseVersion`.

## Version Format

Use full semver:

```text
MAJOR.MINOR.PATCH
```

Example:

```text
2.0.0
```

Do not write only `2.0`. Always include the patch number.

## Commit Naming Convention

Use Conventional Commits. The version bump is decided from the commit type.

Patch release:

```text
fix: prevent login crash when email is empty
```

Example version change:

```text
2.0.0 -> 2.0.1
```

Minor release:

```text
feat: add responder dispatch dashboard
```

Example version change:

```text
2.0.0 -> 2.1.0
```

Major release:

```text
feat!: replace incident payload format
```

Or:

```text
feat: replace incident payload format

BREAKING CHANGE: incident payloads now require the responder region id
```

Example version change:

```text
2.0.0 -> 3.0.0
```

No version bump by default:

```text
docs: update deployment checklist
chore: clean unused scripts
style: format dashboard table
test: add auth coverage
refactor: simplify report mapper
ci: update workflow permissions
build: adjust vite config
```

## Breaking Changes

Use `!` when the change breaks compatibility for existing users, deployed apps, API clients, environment setup, or saved data.

Breaking changes increase the major version:

```text
2.1.0 -> 3.0.0
```

A breaking change does not have to be a large code change. For example, this can be a major release:

```text
feat!: change incident route response format
```

If the old API returned:

```json
{
  "id": "123",
  "status": "pending"
}
```

And the new API returns:

```json
{
  "incidentId": "123",
  "state": "pending"
}
```

Existing frontend or mobile code may break unless it is updated. That is why this is a major version change.

Use this question when deciding:

```text
Will existing users, deployed apps, old API clients, old environment setup, or existing data keep working without changes?
```

If the answer is no, use a breaking change commit.

Major release examples:

```text
feat!: require region id when creating incidents
feat!: replace user roles with permission scopes
feat!: remove legacy announcement endpoints
feat!: change auth token storage format
feat!: migrate report status values
feat!: require email verification before login
feat!: change Firebase project configuration keys
feat!: remove support for old mobile app versions
feat!: change database schema for incident locations
feat!: rename disaster category identifiers
```

A breaking change can also be a fix:

```text
fix!: enforce stricter responder access rules
```

Use `fix!:` when the change corrects a bug but also breaks compatibility or blocks behavior that previously worked.

## Staging Releases

Yes, staging should participate in versioning, but staging should be treated as a test release lane.

Recommended staging behavior:

```text
2.1.0-staging.1
2.1.0-staging.2
2.1.0-staging.3
```

Recommended production behavior:

```text
2.1.0
```

This lets the team test release candidates without consuming the final production version too early.

Important mobile note: Expo's `version` is the user-facing app version. On Android it maps to `versionName`; on iOS it maps to `CFBundleShortVersionString`. Keep the native mobile app version clean, such as `2.1.0`. Use staging prerelease labels for package versions, git tags, GitHub releases, build names, release notes, and internal artifacts.

## Branch Rules

Recommended release branches:

```text
staging
main
production
```

Use `staging` for prerelease validation.

Use `main` or `production` for stable releases. Pick one production branch name and keep it consistent in CI.

## How Automation Should Work

The release automation should:

1. Run when commits are pushed or merged into `staging` or the production branch.
2. Read commit messages since the last release tag.
3. Decide the bump using the Conventional Commit rules.
4. Update both package versions:

```text
Frontend/package.json
Frontend/package-lock.json
mobile/client/package.json
mobile/client/package-lock.json
```

5. Create a release commit, for example:

```text
chore(release): 2.1.0
```

6. Create a git tag, for example:

```text
v2.1.0
```

7. Build and deploy using that version.

The automation files are:

```text
.github/workflows/release.yml
release.config.cjs
scripts/sync-release-version.cjs
package.json
package-lock.json
```

## First Release Setup

Because Rescuenect is starting this system at version `2.0.0`, the release setup should create a baseline tag before automated bumping starts:

```text
v2.0.0
```

Without this baseline tag, automation may scan older commits and calculate a bump from old history.

The baseline tag must be reachable from each branch that releases. If `v2.0.0` was created on `staging`, merge that same commit into `main` without squash before the first production release. If the baseline is squash-merged into `main`, recreate the `v2.0.0` tag on the matching `main` commit before enabling the first production release.

## Repository Settings

GitHub Actions must be allowed to write release commits, tags, and GitHub releases.

In GitHub, check:

```text
Settings -> Actions -> General -> Workflow permissions -> Read and write permissions
```

If `main` or `staging` has branch protection that blocks GitHub Actions from pushing release commits, create a repository secret named:

```text
SEMANTIC_RELEASE_TOKEN
```

Use a fine-grained GitHub token that can write contents for this repository. The workflow will use `SEMANTIC_RELEASE_TOKEN` when it exists, otherwise it falls back to the built-in `GITHUB_TOKEN`.

## Day-to-Day Flow

Work normally on feature branches, then merge into `staging`.

When `staging` receives a commit such as:

```text
feat: add disaster readiness checklist
```

semantic-release creates a staging prerelease, for example:

```text
2.1.0-staging.1
```

After QA passes on staging, merge the tested code into `main`. The production release will become:

```text
2.1.0
```

## Making This Effective

Keep commit messages clean. The first word before `:` matters.

Use `feat:` only for user-visible new functionality.

Use `fix:` for bug fixes that should increase the patch version.

Use `!` or `BREAKING CHANGE:` only when a release really breaks compatibility, changes required environment variables, changes API contracts, or requires special migration steps.

Avoid squash merge messages like:

```text
update files
```

Prefer squash merge messages like:

```text
feat: add incident export filters
```

Do not manually edit versions after automation is enabled unless you are intentionally correcting a release problem.

Before production release, confirm that staging has already passed QA with the same code or a known commit.

For mobile app store builds, remember that the app version and native build number are different. EAS can auto-increment Android `versionCode` and iOS `buildNumber`, while semver controls the user-facing app version.

## Quick Reference

```text
fix:      PATCH  2.0.0 -> 2.0.1
feat:     MINOR  2.0.0 -> 2.1.0
feat!:    MAJOR  2.0.0 -> 3.0.0
docs:     no version bump
chore:    no version bump
refactor: no version bump
test:     no version bump
ci:       no version bump
build:    no version bump
```
