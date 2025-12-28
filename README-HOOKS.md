# Git Hooks Setup Guide

This project uses [Husky](https://typicode.github.io/husky/) v9 to manage Git hooks.

## Quick Setup

After cloning the repository, run:

```bash
npm install
```

The `postinstall` script will automatically install the hooks.

If hooks aren't working, manually install them:

```bash
npm run prepare
```

Or:

```bash
npx husky install
```

## Verify Hooks Are Installed

Check if hooks are installed:

```bash
# On Windows (PowerShell)
.\scripts\verify-hooks.ps1

# On Unix/Mac/Git Bash
./scripts/install-hooks.sh

# Or use npm script
npm run verify-hooks
```

You should see `.git/hooks/pre-commit` and `.git/hooks/pre-push` files exist.

## What the Hooks Do

### Pre-Commit Hook (`.husky/pre-commit`)
- Runs `npm run typecheck` before each commit
- Blocks commit if TypeScript errors are found
- Catches unused imports, type errors, etc.

### Pre-Push Hook (`.husky/pre-push`)
- Runs `npm run build` before each push
- Blocks push if build fails
- Matches what CI runs, so you catch errors before pushing

## Troubleshooting

### Hooks Not Running

1. **Check if hooks are installed:**
   ```bash
   ls .git/hooks/pre-commit
   ```

2. **If missing, install them:**
   ```bash
   npm run prepare
   ```

3. **Verify hook content:**
   The hook should reference Husky. Check with:
   ```bash
   cat .git/hooks/pre-commit
   ```

### Windows Issues

On Windows, Git hooks need to run in a shell that supports `#!/bin/sh`:
- **Git Bash** (recommended) - comes with Git for Windows
- **WSL** (Windows Subsystem for Linux)
- **PowerShell** - may have issues with shell scripts

If using PowerShell, consider using Git Bash for commits:
```bash
# In Git Bash
git commit -m "your message"
```

### Bypassing Hooks (Not Recommended)

If you absolutely need to bypass hooks (e.g., for emergency fixes):

```bash
git commit --no-verify -m "emergency fix"
git push --no-verify
```

**Warning:** This defeats the purpose of hooks. Only use in emergencies.

## Testing Hooks

To verify hooks work:

1. Create a test file with TypeScript errors:
   ```typescript
   // src/test-error.ts
   import { NonExistentType } from './lib/nowhere';
   ```

2. Try to commit:
   ```bash
   git add src/test-error.ts
   git commit -m "test"
   ```

3. The hook should block the commit and show TypeScript errors.

4. Remove the test file and try again - it should work.

## CI/CD

The GitHub Actions workflow runs the same checks:
- `npm run build` (which includes `tsc`)
- This matches the pre-push hook

If hooks work locally, CI should pass too.

