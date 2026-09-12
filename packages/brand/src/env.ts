// Node/Bun variant of the brand module. In addition to `process.env` it reads
// a root-level `.env` file by walking up from the working directory, so a
// single `.env` at the repo root drives branding for every package no matter
// which `--cwd` the process was launched from. Import this from Bun/Node code
// (TUI, CLI, server, desktop main); web/Vite code should keep using
// `@opencode-ai/brand` (which is browser-safe).
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { setBrandVars } from "./index"

function parseEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith("#")) continue
    const eq = line.indexOf("=")
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

function findEnv(): Record<string, string> {
  let dir = process.cwd()
  for (let up = 0; up < 10; up++) {
    try {
      return parseEnv(readFileSync(join(dir, ".env"), "utf8"))
    } catch {
      // keep walking up
    }
    const parent = join(dir, "..")
    if (parent === dir) break
    dir = parent
  }
  return {}
}

const file = findEnv()
const pick = (key: string): string | undefined => process.env[key] ?? file[key]
const pickNum = (key: string): number | undefined => {
  const value = Number(pick(key))
  return Number.isFinite(value) ? value : undefined
}

setBrandVars({
  name: pick("BRAND_NAME"),
  tagline: pick("BRAND_TAGLINE"),
  title: pick("BRAND_TITLE"),
  short: pick("BRAND_SHORT"),
  org: pick("BRAND_ORG"),
  orgWebsite: pick("BRAND_ORG_WEBSITE"),
  orgAbout: pick("BRAND_ORG_ABOUT"),
  split: pickNum("BRAND_SPLIT"),
})

export * from "./index"