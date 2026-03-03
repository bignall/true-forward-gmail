# Contributing to True Forward

Thanks for your interest in contributing! This project is a Google Apps Script Gmail™ add-on, so the development workflow is a bit different from typical Node/web projects.

## Getting Started

1. **Fork** this repository and clone it locally
2. Create a new Apps Script project at [script.google.com](https://script.google.com)
3. Copy each `.gs` file from `src/` into your Apps Script project
4. Replace `appsscript.json` with the one from this repo
5. Deploy as a test add-on (Deploy → Test deployments → Gmail™ Add-on → Install)

## Development Workflow

Since Apps Script runs in Google's cloud, there's no local runtime. You have two options:

- **Manual copy-paste:** Edit files locally, paste into the Apps Script editor, and test
- **clasp (recommended for frequent changes):** Install [clasp](https://github.com/google/clasp) to push/pull files between your local repo and Apps Script

## Making Changes

1. Create a feature branch from `main`
2. Make your changes in the `src/` files
3. Test in your own Gmail account via a test deployment
4. Submit a pull request with a clear description of what changed and why

## Code Style

- Use `const` / `let` (no `var`)
- Use template literals for string interpolation
- Keep functions small and focused
- Add a brief comment for non-obvious logic

## Reporting Issues

Use the [issue templates](https://github.com/bignall/true-forward-gmail/issues/new/choose) to report bugs or request features.

## License

By contributing, you agree that your contributions will be licensed under the GPL v2 License.
