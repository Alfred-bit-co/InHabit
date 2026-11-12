/**
 * Export statique du site pour GitHub Pages.
 *
 *   npm run export:static            → génère ./out
 *   npm run export:static -- --deploy → génère ./out puis le pousse sur la branche gh-pages
 *
 * Principe : build de production sous le préfixe /InHabit (dans .next-static pour ne pas
 * toucher au build normal), lancement du serveur en local, puis enregistrement de chaque
 * page en HTML avec les fichiers JS/CSS et les images. Le résultat est un site 100 % statique :
 * l'admin Payload et l'envoi des formulaires ne fonctionnent pas sur GitHub Pages.
 */
import { spawn, execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE = '/InHabit'
const PUBLIC_URL = `https://alfred-bit-co.github.io${BASE}`
const REPO = 'https://github.com/Alfred-bit-co/InHabit.git'
const PORT = 3999
const LOCAL = `http://localhost:${PORT}`
const DIST = '.next-static'
const OUT = path.join(ROOT, 'out')
const NEXT_BIN = path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next')

const env = {
  ...process.env,
  NODE_OPTIONS: '--no-deprecation --max-old-space-size=8000',
  NEXT_BASE_PATH: BASE,
  NEXT_DIST_DIR: DIST,
  NEXT_PUBLIC_SERVER_URL: PUBLIC_URL,
}

const run = (args) =>
  new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [NEXT_BIN, ...args], { cwd: ROOT, env, stdio: 'inherit' })
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`next ${args[0]} a échoué (${code})`))))
  })

async function waitForServer() {
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(`${LOCAL}${BASE}/`)
      if (r.status < 500) return
    } catch {}
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error('Le serveur local ne répond pas')
}

const SKIP = /^\/(admin|api|_next)(\/|$)/
const ASSET_EXT = /\.[a-z0-9]{2,5}$/i

function outPathFor(p, isPage) {
  const rel = decodeURIComponent(p.slice(BASE.length)) || '/'
  if (!isPage) return path.join(OUT, rel)
  return path.join(OUT, rel, 'index.html')
}

/** Remplace toute URL locale restante par l'URL publique. */
const fixHtml = (html) =>
  html
    .replaceAll(LOCAL, PUBLIC_URL.replace(BASE, ''))
    .replace(/(["'(\s])\/api\/media\/file\//g, `$1${BASE}/api/media/file/`)

async function crawl() {
  const queue = [`${BASE}/`]
  const seen = new Set(queue)
  const assets = new Set()
  let pages = 0

  while (queue.length) {
    const p = queue.shift()
    const res = await fetch(LOCAL + p, { redirect: 'follow' })
    const type = res.headers.get('content-type') || ''
    if (!res.ok || !type.includes('text/html')) {
      console.warn(`  ! ${p} → ${res.status}`)
      continue
    }
    const html = fixHtml(await res.text())
    const file = outPathFor(p.replace(/\/$/, ''), true)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, html)
    pages++
    console.log(`  ✓ ${p}`)

    for (const [, raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      let url
      try {
        url = new URL(raw.replaceAll('&amp;', '&'), LOCAL + p)
      } catch {
        continue
      }
      const isLocal = url.origin === LOCAL || url.href.startsWith(PUBLIC_URL)
      if (!isLocal || !url.pathname.startsWith(BASE)) continue
      const sub = url.pathname.slice(BASE.length) || '/'
      if (SKIP.test(sub)) continue
      if (ASSET_EXT.test(sub)) assets.add(url.pathname)
      else {
        const clean = url.pathname.replace(/\/$/, '') || `${BASE}/`
        const key = clean === BASE ? `${BASE}/` : clean
        if (!seen.has(key)) {
          seen.add(key)
          queue.push(key)
        }
      }
    }
  }

  // Fichiers servis par l'app hors /_next et /api (favicon, icônes…)
  for (const a of assets) {
    const r = await fetch(LOCAL + a)
    if (!r.ok) continue
    const file = outPathFor(a, false)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()))
  }

  // Page 404
  const r404 = await fetch(`${LOCAL}${BASE}/__page-introuvable__`)
  fs.writeFileSync(path.join(OUT, '404.html'), fixHtml(await r404.text()))

  return pages
}

function copyDir(from, to) {
  if (fs.existsSync(from)) fs.cpSync(from, to, { recursive: true })
}

function deploy() {
  const git = (...args) => execFileSync('git', args, { cwd: OUT, stdio: 'inherit' })
  fs.rmSync(path.join(OUT, '.git'), { recursive: true, force: true })
  git('init', '-q', '-b', 'gh-pages')
  git('add', '-A')
  git('commit', '-q', '-m', `Export statique du ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`)
  git('push', '-f', REPO, 'gh-pages')
  fs.rmSync(path.join(OUT, '.git'), { recursive: true, force: true })
}

async function main() {
  console.log('▸ Build de production (préfixe /InHabit)…')
  await run(['build'])

  console.log('▸ Démarrage du serveur local…')
  const server = spawn(process.execPath, [NEXT_BIN, 'start', '-p', String(PORT)], { cwd: ROOT, env, stdio: 'ignore' })
  try {
    await waitForServer()
    fs.rmSync(OUT, { recursive: true, force: true })
    fs.mkdirSync(OUT, { recursive: true })

    console.log('▸ Enregistrement des pages…')
    const pages = await crawl()

    copyDir(path.join(ROOT, DIST, 'static'), path.join(OUT, '_next', 'static'))
    copyDir(path.join(ROOT, 'media'), path.join(OUT, 'api', 'media', 'file'))
    copyDir(path.join(ROOT, 'public'), OUT)
    fs.writeFileSync(path.join(OUT, '.nojekyll'), '') // sinon GitHub Pages ignore le dossier _next

    console.log(`▸ ${pages} pages exportées dans ./out`)
  } finally {
    server.kill()
  }

  if (process.argv.includes('--deploy')) {
    console.log('▸ Publication sur la branche gh-pages…')
    deploy()
    console.log(`▸ En ligne d'ici 1 à 2 minutes : ${PUBLIC_URL}/`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
