#!/usr/bin/env bun

import { readdirSync } from "node:fs"
import { join, relative } from "node:path"
import process from "node:process"
import { parseArgs } from "node:util"

const root = join(import.meta.dir, "..")

const EXTENSIONS = new Set([".ts", ".tsx", ".md", ".mdx", ".astro", ".html", ".json"])
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage", "generated", "caches"])

const BASE_ROOTS = [
  "packages/app/src/i18n",
  "packages/console/app/src",
  "packages/desktop/src/renderer/i18n",
  "packages/stats/app/src",
  "packages/ui/src/i18n",
]

const DOC_ROOT = "packages/web/src"
const EXCLUDED = new Set([join(root, "packages", "console", "app", "src", "routes", "legal")])

function readEnv() {
  try {
    const text = Bun.file(join(root, ".env")).text()
    const env: Record<string, string> = {}
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eq = trimmed.indexOf("=")
      if (eq === -1) continue
      env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
    }
    return env
  } catch {
    return {}
  }
}

const { values } = parseArgs({
  options: {
    name: { type: "string" },
    "dry-run": { type: "boolean", default: false },
    docs: { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
})

const name = values.name ?? readEnv().BRAND_NAME ?? "Shark"
const dryRun = values["dry-run"] ?? false

if (values.help) {
  console.log(`usage: bun run script/rebrand.ts [--name "Shark"] [--dry-run] [--docs]`)
  process.exit(0)
}

function filesUnder(dir: string): string[] {
  const out: string[] = []
  let entries: string[]
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue
    if (SKIP_DIRS.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...filesUnder(full))
    else if (EXTENSIONS.has(entry.name.slice(entry.name.lastIndexOf(".")))) out.push(full)
  }
  return out
}

let changedFiles = 0
let replacedTokens = 0

async function main() {
  const roots = values.docs ? [...BASE_ROOTS, DOC_ROOT] : BASE_ROOTS
  for (const rootRel of [...roots, "README.md"]) {
    const abs = join(root, rootRel)
    if (EXCLUDED.has(abs)) continue
    for (const file of filesUnder(abs)) {
      if (isExcluded(file)) continue
      const text = await Bun.file(file).text()
      const next = text.replace(/\bOpenCode\b/g, name)
      if (next === text) continue
      changedFiles += 1
      replacedTokens += (text.match(/\bOpenCode\b/g) ?? []).length
      if (dryRun) {
        console.log(`would update ${relative(root, file)}`)
      } else {
        await Bun.write(file, next)
        console.log(`updated ${relative(root, file)}`)
      }
    }
  }

  console.log(
    dryRun
      ? `[dry-run] ${changedFiles} files would change, ${replacedTokens} tokens`
      : `rebranded to "${name}": ${changedFiles} files, ${replacedTokens} tokens`,
  )
}

function isExcluded(file: string) {
  return [...EXCLUDED].some((dir) => file.startsWith(dir + "\\") || file.startsWith(dir + "/"))
}

await main()