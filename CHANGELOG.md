# Changelog

All notable changes to this project will be documented in this file.

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

### Security and packaging

- Restricted npm publish output to the runtime bundle, CLI wrapper, and README
- Removed test and internal workspace files from the published tarball
- Added runtime-compatible type exports for generated config files
- Verified the published package with `npm pack --dry-run`, `npm test`, `npm run build`, and `npm audit`

### Notes

- Requires Node.js 18 or newer
- Designed for Payload CMS projects that expose a `posts` collection
