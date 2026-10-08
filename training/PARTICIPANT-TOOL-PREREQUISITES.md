# Before you arrive: tool setup

This session uses Claude Code against a small Node.js/React application
(Internal Request Hub). Complete this checklist on your own laptop
before the session — the session itself starts with the live demo,
followed by hands-on team work, and neither includes time for software
installation.

## What you will have, by the end of this checklist

- Git, Node.js and npm installed and working
- Your own GitHub account
- Claude Code installed and signed in
- A code editor


## 1. Install and verify core tools

Open a terminal (macOS: Terminal; Windows: PowerShell or Windows
Terminal) and run:

```bash
git --version
node --version
npm --version
```

Required:

- [ ] Git is installed
- [ ] Node.js is version 22.13 or later (Node 22 LTS is fine)
- [ ] npm is version 10 or later

If anything is missing:

- **Git** — macOS: `brew install git` (or install Xcode Command Line
  Tools, which includes it). Windows: <https://git-scm.com/download/win>.
- **Node.js** — install from <https://nodejs.org> (LTS) or via a
  version manager (`nvm`, `fnm`). Use your organization-approved method
  if one exists.

Configure Git if you haven't already:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

## 2. Make sure you have a GitHub account

- [ ] I have a personal GitHub account (a free account is enough)
- [ ] I can sign in at <https://github.com>

If your team doesn't already know who's creating the shared repo for
session 2, decide that now — see above.

## 3. Install and authenticate Claude Code

Use your organization's approved installation method. If your
organization permits Anthropic's npm installation method:

```bash
npm install -g @anthropic-ai/claude-code
claude doctor
```

Then verify it starts:

```bash
claude --version
claude
```

Complete sign-in in the browser when prompted. **Never** share your
password, API key, authentication code, or session token with anyone,
including the facilitator, and never paste it into a prompt.

- [ ] `claude --version` runs without error
- [ ] `claude` starts and I completed sign-in successfully

Official reference, if you hit setup issues specific to your OS or
organization: <https://code.claude.com/docs/en/setup>.

## 4. A code editor

- [ ] I have a code editor installed (VS Code is recommended, but any
  editor you're comfortable with works: <https://code.visualstudio.com>)

## 5. The GitHub CLI

```text
macOS (Homebrew):   brew install gh
Windows (winget):   winget install --id GitHub.cli
```

Then once: `gh auth login`, verified with `gh auth status`.

## Windows notes

Claude Code's exact setup steps can differ by version and by whether
you run it natively on Windows or inside WSL (Windows Subsystem for
Linux). Follow the official setup guide linked above for the current
recommended path for your version, and allow extra time if WSL needs
to be installed — it is a larger download and may require a restart.


