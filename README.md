# Shark

An AI coding agent for your terminal.

Shark runs in your terminal, understands your codebase, and helps you write, review, and ship code.

## Installation

```bash
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/avasaralasaipavan/shark/shark-branding/script/distro/install.sh | bash

# Windows (PowerShell)
iwr https://raw.githubusercontent.com/avasaralasaipavan/shark/shark-branding/script/distro/install.ps1 | iex
```

This installs a single `shark` binary onto your `PATH`. Then just run:

```bash
shark
```

Alternatively, clone and build from source:

```bash
git clone https://github.com/avasaralasaipavan/shark.git
cd shark
bun install
bun run shark:build
```

See [DISTRIBUTION.md](./DISTRIBUTION.md) for pinned versions, local builds, and all installer flags.

## Agents

Shark includes two built-in agents you can switch between with the `Tab` key.

- **build** - Default, full-access agent for development work
- **plan** - Read-only agent for analysis and code exploration
  - Denies file edits by default
  - Asks permission before running bash commands
  - Ideal for exploring unfamiliar codebases or planning changes

A **general** subagent is also available for complex searches and multistep tasks. Invoke it with `@general` in a message.

## Contributing

Please read the [contributing docs](./CONTRIBUTING.md) before submitting a pull request.

## License

See [LICENSE](./LICENSE).
