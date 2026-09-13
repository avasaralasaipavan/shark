# Distribution — how Shark gets to users

This repo ships a single self-contained CLI binary named **`shark`** for macOS, Linux and Windows. This file documents what artifacts are produced, how they are published, and how users install/update/uninstall them — essentially the same distribution model as upstream opencode, renamed.

---

## What a user runs

```bash
# macOS / Linux (bash)
curl -fsSL https://raw.githubusercontent.com/avasaralasaipavan/shark/shark-branding/script/distro/install.sh | bash

# Windows (PowerShell)
iwr https://raw.githubusercontent.com/avasaralasaipavan/shark/shark-branding/script/distro/install.ps1 | iex
```

That lands a single static `shark` binary on `PATH` (`~/.local/bin/shark` on macOS/Linux, `%LOCALAPPDATA%\shark\bin\shark.exe` on Windows). Users then just type `shark`.

Other install flags (both scripts):

| Flag | Effect |
| --- | --- |
| `-v, --version 1.0.0` (`-Version 1.0.0`) | install a pinned `shark-v1.0.0` release |
| `-b, --binary /path` (`-Binary C:\path\shark.exe`) | install from a local binary, skipping download |
| `--update` (`-Update`) | force re-download of the latest version |
| `--uninstall` (`-Uninstall`) | remove the binary **and** the PATH entry the installer added |
| `--no-modify-path` (`-NoModifyPath`) | skip shell profile / PATH changes |

Uninstalling never touches user data. Shark stores config/data/credentials in the standard opencode directories (`~/.config/opencode`, `~/.local/share/opencode`) — those deliberately survive uninstall/reinstall.

## Uninstalling

Re-run the same installer with the uninstall flag:

```bash
# macOS / Linux (bash)
curl -fsSL https://raw.githubusercontent.com/avasaralasaipavan/shark/shark-branding/script/distro/install.sh | bash -s -- --uninstall
```

```powershell
# Windows (PowerShell) — download first, uninstall flag is not piped
iwr https://raw.githubusercontent.com/avasaralasaipavan/shark/shark-branding/script/distro/install.ps1 -OutFile install.ps1
.\install.ps1 -Uninstall
```

This removes the `shark`/`shark.exe` binary (`~/.local/bin` on macOS/Linux, `%LOCALAPPDATA%\shark\bin` on Windows) and the PATH entry the installer added. Config/data/credentials are left in place.

**Windows locked-down PowerShell (execution policy blocks scripts):**

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1 -Uninstall
```

Or, without saving a file at all:

```powershell
powershell -ExecutionPolicy Bypass -Command "iex ((New-Object Net.WebClient).DownloadString('https://raw.githubusercontent.com/avasaralasaipavan/shark/shark-branding/script/distro/install.ps1') + ' -Uninstall')"
```

The `Bypass` flag scopes to that single command and does not change your system's execution policy.

---

## Release artifacts

CI (`.github/workflows/shark-release.yml`) builds **12 native targets** via Bun and uploads them as a GitHub Release:

| Archive | Platform |
| --- | --- |
| `shark-windows-x64.zip` | Windows x64 |
| `shark-windows-arm64.zip` | Windows ARM64 |
| `shark-windows-x64-baseline.zip` | Windows x64 (no AVX2) |
| `shark-darwin-x64.zip` | macOS Intel |
| `shark-darwin-arm64.zip` | macOS Apple Silicon |
| `shark-darwin-x64-baseline.zip` | macOS Intel (no AVX2) |
| `shark-linux-x64.tar.gz` | Linux x64 (glibc) |
| `shark-linux-arm64.tar.gz` | Linux ARM64 (glibc) |
| `shark-linux-x64-baseline.tar.gz` | Linux x64 (no AVX2) |
| `shark-linux-x64-musl.tar.gz` | Linux x64 (Alpine/musl) |
| `shark-linux-arm64-musl.tar.gz` | Linux ARM64 (musl) |
| `shark-linux-x64-baseline-musl.tar.gz` | Linux x64 baseline (musl) |

Each archive contains the single `shark` binary (`shark.exe` on Windows). Download URLs follow the pattern:

```
https://github.com/avasaralasaipavan/shark/releases/latest/download/shark-linux-x64.tar.gz
https://github.com/avasaralasaipavan/shark/releases/download/shark-v1.0.0/shark-darwin-arm64.zip
```

---

## Publishing a release

1. **Repo URL.** This fork lives at `avasaralasaipavan/shark`. The installers resolve assets against it via a `SHARK_REPO` constant (`owner/repo`) — already set in `script/distro/install.sh` and `script/distro/install.ps1`. If the repo is ever moved, update those two constants. The GitHub workflow uses `github.repository`, so it needs no constant. Branding values baked into CI builds live in the workflow `env:` block (the root `.env` is gitignored).

2. **Trigger a release** — either:
   - push a tag: `git tag shark-v1.2.3 && git push origin shark-v1.2.3`, or
   - run the **Shark Release** workflow manually with a version input.

   The workflow creates the `shark-v1.2.3` release, builds all 12 targets, and uploads the assets. `OPENCODE_VERSION`, `OPENCODE_CHANNEL=latest`, `OPENCODE_RELEASE=1` and `GH_REPO` (all consumed by `@opencode-ai/script`) are set by the workflow.

3. **Share the one-liner.**

### Local build (test before releasing)

```bash
bun run shark:build   # single-target build for your current machine -> dist/shark-<os>-<arch>/bin/shark
bun run shark:bundle  # all 12 targets (no upload) -> dist/shark-*/
```

The build is `packages/opencode/script/build.ts`. It:
- regenerates `packages/brand/src/defaults.gen.ts` from the root `.env` (or `process.env`) `BRAND_*` values, so compiled binaries ship branded even with no `.env` next to them — runtime `BRAND_*`/`.env` values still win;
- compiles each target to `dist/shark-<os>-<arch>[-baseline][-musl]/bin/shark`;
- when run with `OPENCODE_RELEASE=1`, zips/tars the binaries and uploads to `gh release upload` for `GH_REPO`.

Windows code signing (`script/sign-windows.ps1`) runs in the workflow as a best-effort step and **no-ops** unless you configure the `AZURE_TRUSTED_SIGNING_*` secrets. Without it users see an "unknown publisher" SmartScreen prompt — functionality is unaffected. macOS signing is not wired up yet.

---

## Caveats

- **Unsigned binaries** — Windows/macOS show browser/OS warnings on first run until signing is configured (see above).
- **Shared state with opencode** — Shark uses the same data/config/credential directories and env vars as opencode. A machine with both installed shares auth.
- **In-app update check** — the CLI's "new version available" check still talks to the upstream `opencode-ai` npm registry; use the installer's `--update` for Shark-specific updates. Suppressing the upstream check is a follow-up.
- **`--user-agent`** header still reads `opencode/<version>` — an internal identifier, invisible to end users.
- **Documentation/legal copy** — docs pages and console legal pages still say "opencode"; run `bun run script/rebrand.ts --docs` to sweep them.

---

## npm distribution (deferred, documented for later)

Upstream also ships via npm (`opencode-ai`). The same path can be mirrored for Shark without code changes:

1. Per-platform packages `shark-windows-x64`, `shark-darwin-arm64`, etc. (name = `shark-<os>-<arch>[-baseline][-musl]`), each carrying `dist/<name>/bin/shark` + the generated `package.json` already written by `build.ts`.
2. A wrapper package (e.g. `shark-ai`) exposing `bin.shark` → the platform package's binary via the Node wrapper + a `postinstall.mjs` that copies/links it (see `packages/opencode/script` wrapper generation and `packages/opencode/script/postinstall.mjs`).
3. Publish with `OPENCODE_VERSION=<version> OPENCODE_CHANNEL=latest OPENCODE_RELEASE=1 GH_REPO=<repo> bun run script/publish.ts` — or a dedicated `shark-publish` workflow mirroring `.github/workflows/publish.yml`, keyed on `shark-v*` tags.

Users would then `npm install -g shark-ai` and get the `shark` command. Nothing in the current build blocks this; it's just not wired up yet.