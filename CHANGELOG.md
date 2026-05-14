# Changelog

All notable changes to this project will be documented in this file.

## 0.2.0 - 2026-05-14

### Added

- Profile-aware list presentation with per-profile `list.columns` and `list.searchFields`
- `PayloadPostWorkspaceConfig` for multi-site / multi-account setups via `profiles`
- `--profile` flag to select a config profile at runtime
- `uniqueEnumArraySchema` validation for list columns and search fields (rejects duplicates, unknown fields, and empty arrays)
- `listPosts` uses profile-specific `searchFields` when building `where.or` queries
- `formatPostsTable` accepts custom column order with empty-cell fallback for missing values
- E2E and unit regression tests for profile selection, custom columns, and schema validation

## 0.2.1 - 2026-05-14

### Changed

- `payload-post config init` now writes to `~/.config/payload-post/` instead of the current working directory
- Config lookup now falls back to `~/.config/payload-post/payload-post.config.ts` when no local config is found

### Added

- `--out <dir>` flag on `config init` for custom output directory
- `getGlobalConfigDir()` and `getGlobalConfigPath()` helpers
- E2E tests for `--out` flag and default global path behavior

## 0.1.0 - 2026-05-13

Initial public release of `payload-post`, a terminal-native CLI for managing Payload CMS posts.

### Added

- `list`, `create`, `update`, `delete`, and `publish` commands
- `tui` preview mode for a three-pane terminal dashboard
- `--config` support for loading local JSON, JS, TS, MJS, CJS config files
- `--json` output for script-friendly workflows
- `--verbose` request logging
- Auth support for `jwt`, `apiKey`, and login-based JWT exchange
- `payload-post config init` for scaffolding a starter config file
- Published package metadata and binary entrypoint suitable for `npm install -g`
- Scoped package name for the `@anlstudio` organization

### Security and packaging

- Restricted npm publish output to the runtime bundle, CLI wrapper, and README
- Removed test and internal workspace files from the published tarball
- Added runtime-compatible type exports for generated config files
- Verified the published package with `npm pack --dry-run`, `npm test`, `npm run build`, and `npm audit`

### Notes

- Requires Node.js 18 or newer
- Designed for Payload CMS projects that expose a `posts` collection
