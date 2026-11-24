'use client'

import Link from 'next/link'
import { useCaptureShield } from './useCaptureShield'
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { addPdfBookmark, savePdfPage } from '@/app/(frontend)/espace-membre/actions'
import { IconArrowLeft, IconBookmark, IconChevron } from './icons'

type Props = {
  bookTitle: string
  /** Jeton de lecture signé (12 h) et clé de débrouillage dérivée. */
  token: string
  scrambleKey: string
  size: number
  initialPage: number
  marks: number[]
  reader: { name: string; email: string }
}

const FILE_URL = '/espace-membre/livre/fichier'
const GAP = 28

const hexToBytes = (hex: string) => new Uint8Array(hex.match(/../g)?.map((h) => parseInt(h, 16)) ?? [])

/** Filigrane dessiné DANS l'image de la page : il apparaît sur toute capture ou vidéo. */
function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number, reader: Props['reader']) {
  const stamp = new Date().toLocaleDateString('fr-FR')
  const text = `${reader.name} · ${reader.email} · ${stamp}`
  ctx.save()
  ctx.fillStyle = '#1f1a15'
  ctx.globalAlpha = 0.075
  ctx.font = `600 ${Math.round(13 * dpr)}px system-ui, sans-serif`
  ctx.translate(w / 2, h / 2)
  ctx.rotate(-Math.PI / 6)
  const step = ctx.measureText(text).width + 70 * dpr
  for (let y = -h; y < h; y += 110 * dpr) {
    const shift = (Math.abs(y / (110 * dpr)) % 2) * (step / 2)
    for (let x = -w * 1.2; x < w * 1.2; x += step) ctx.fillText(text, x + shift, y)
  }
  ctx.restore()
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.fillStyle = '#1f1a15'
  ctx.font = `${Math.round(10 * dpr)}px system-ui, sans-serif`
  ctx.fillText(`Exemplaire de ${reader.name} — ${reader.email}`, 14 * dpr, h - 12 * dpr)
  ctx.restore()
}

/** Une page du PDF rendue dans un canvas, à la taille de la boîte. */
function PdfPage({
  doc,
  num,
  box,
  reader,
}: {
  doc: PDFDocumentProxy
  num: number
  box: { w: number; h: number }
  reader: Props['reader']
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let task: RenderTask | null = null
    let cancelled = false
    ;(async () => {
      const page = await doc.getPage(num)
      if (cancelled || !ref.current) return
      const base = page.getViewport({ scale: 1 })
      const scale = Math.min(box.w / base.width, box.h / base.height)
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
      const viewport = page.getViewport({ scale: scale * dpr })
      const canvas = ref.current
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      canvas.style.width = `${Math.floor(viewport.width / dpr)}px`
      canvas.style.height = `${Math.floor(viewport.height / dpr)}px`
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      task = page.render({ canvas, canvasContext: ctx, viewport })
      try {
        await task.promise
        if (!cancelled) drawWatermark(ctx, canvas.width, canvas.height, dpr, reader)
      } catch {
        /* rendu annulé (changement de page) */
      }
    })()
    return () => {
      cancelled = true
      task?.cancel()
    }
  }, [doc, num, box.w, box.h, reader])
  return <canvas ref={ref} className="pdf-page" aria-label={`Page ${num}`} />
}

/** Miniature, dessinée seulement quand elle devient visible dans la bande. */
function Thumb({ doc, num, active, marked, onClick }: { doc: PDFDocumentProxy; num: number; active: boolean; marked: boolean; onClick: () => void }) {
  const btn = useRef<HTMLButtonElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const done = useRef(false)
  useEffect(() => {
    const el = btn.current
    if (!el) return
    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting || done.current || !canvas.current) return
        done.current = true
        io.disconnect()
        try {
          const page = await doc.getPage(num)
          const base = page.getViewport({ scale: 1 })
          const viewport = page.getViewport({ scale: (76 / base.height) * 1.5 })
          const c = canvas.current
          if (!c) return
          c.width = Math.floor(viewport.width)
          c.height = Math.floor(viewport.height)
          const ctx = c.getContext('2d')
          if (ctx) await page.render({ canvas: c, canvasContext: ctx, viewport }).promise
        } catch {
          done.current = false
        }
      },
      { rootMargin: '0px 300px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [doc, num])
  return (
    <button ref={btn} type="button" className="reader-thumb pdf-thumb" aria-current={active ? 'page' : undefined} aria-label={`Aller à la page ${num}`} onClick={onClick}>
      <canvas ref={canvas} aria-hidden="true" />
      <span className="reader-thumb-num">{num}</span>
      {marked && <span className="reader-thumb-mark" aria-hidden="true" />}
    </button>
  )
}

/**
 * Liseuse du livre PDF protégé :
 * - le fichier arrive par petits morceaux brouillés (jamais en entier, jamais en clair) ;
 * - pas de téléchargement, d'impression, de clic droit ni de Ctrl+S ;
 * - filigrane au nom du lecteur dans chaque page.
 */
export function PdfReader({ bookTitle, token, scrambleKey, size, initialPage, marks, reader }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [error, setError] = useState('')
  const [box, setBox] = useState({ w: 0, h: 0, cols: 2 })
  const [page, setPage] = useState(Math.max(1, initialPage))
  const [localMarks, setLocalMarks] = useState(marks)
  const [toast, setToast] = useState('')
  const [, startTransition] = useTransition()

  const flash = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2400)
  }, [])

  // Chargement du PDF par morceaux
  useEffect(() => {
    let cancelled = false
    let task: PDFDocumentLoadingTask | null = null
    let worker: Worker | null = null
    const key = hexToBytes(scrambleKey)

    const fetchRange = async (begin: number, end: number) => {
      const out = new Uint8Array(end - begin)
      let pos = begin
      while (pos < end) {
        const res = await fetch(FILE_URL, {
          headers: { 'x-inhabit-reader': token, Range: `bytes=${pos}-${end - 1}` },
          cache: 'no-store',
          credentials: 'same-origin',
        })
        if (res.status !== 206) throw new Error(res.status === 403 ? 'expired' : 'network')
        const chunk = new Uint8Array(await res.arrayBuffer())
        if (!chunk.length) throw new Error('network')
        for (let i = 0; i < chunk.length; i++) chunk[i] ^= key[(pos + i) % key.length]
        out.set(chunk, pos - begin)
        pos += chunk.length
      }
      return out
    }

    ;(async () => {
      try {
        const pdfjs = await import('pdfjs-dist')
        worker = new Worker(new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url), { type: 'module' })
        pdfjs.GlobalWorkerOptions.workerPort = worker
        const transport = new pdfjs.PDFDataRangeTransport(size, null)
        transport.requestDataRange = (begin: number, end: number) => {
          fetchRange(begin, end)
            .then((chunk) => transport.onDataRange(begin, chunk))
            .catch((e: Error) => !cancelled && setError(e.message === 'expired' ? 'expired' : 'network'))
        }
        task = pdfjs.getDocument({
          range: transport,
          rangeChunkSize: 256 * 1024,
          disableAutoFetch: true,
          disableStream: true,
        })
        const loaded = await task.promise
        if (cancelled) return
        setDoc(loaded)
        setPage((p) => Math.min(Math.max(1, p), loaded.numPages))
      } catch (e) {
        console.error(e)
        if (!cancelled) setError('network')
      }
    })()

    return () => {
      cancelled = true
      task?.destroy()
      worker?.terminate()
    }
  }, [token, scrambleKey, size])

  // Taille de la zone de lecture : 2 pages côte à côte sur grand écran, 1 sur mobile
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      const h = entry.contentRect.height
      const cols = w >= 760 ? 2 : 1
      setBox({ w: (w - GAP * (cols - 1)) / cols, h, cols })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const numPages = doc?.numPages ?? 0
  const cols = box.cols
  // Une double page commence toujours sur une page impaire
  const start = cols === 2 ? page - ((page - 1) % 2) : page
  const spread = [start, start + 1].slice(0, cols).filter((n) => n <= numPages)

  const go = useCallback(
    (delta: number) => setPage((p) => Math.min(Math.max(1, (cols === 2 ? p - ((p - 1) % 2) : p) + delta * cols), Math.max(1, numPages))),
    [cols, numPages],
  )

  // Progression enregistrée après une courte pause
  useEffect(() => {
    if (!doc) return
    const id = window.setTimeout(() => startTransition(() => savePdfPage(start)), 1200)
    return () => window.clearTimeout(id)
  }, [doc, start])

  // Miniature active toujours visible
  useEffect(() => {
    const strip = stripRef.current
    const active = strip?.querySelector<HTMLElement>('[aria-current="page"]')
    if (strip && active) strip.scrollTo({ left: active.offsetLeft - strip.clientWidth / 2 + active.clientWidth / 2, behavior: 'smooth' })
  }, [start, doc])

  // Clavier : navigation ; Ctrl/Cmd + S / P bloqués
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if ((e.ctrlKey || e.metaKey) && (k === 's' || k === 'p')) {
        e.preventDefault()
        flash(k === 's' ? 'L’enregistrement du livre est désactivé.' : 'L’impression du livre est désactivée.')
        return
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault()
        go(1)
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        go(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, flash])

  // Pages masquées dès qu'une capture peut se préparer (voir useCaptureShield)
  const hidden = useCaptureShield(flash)

  // Filigrane mobile (nom, email, heure) qui se déplace : il ne peut pas être recadré hors d'une vidéo
  const [tag, setTag] = useState({ x: 8, y: 10, time: '' })
  useEffect(() => {
    const move = () =>
      setTag({
        x: 4 + Math.random() * 56,
        y: 6 + Math.random() * 80,
        time: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
      })
    const first = window.setTimeout(move, 0)
    const every = window.setInterval(move, 6000)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(every)
    }
  }, [])

  // Glissement au doigt
  const touchX = useRef<number | null>(null)

  const marked = localMarks.includes(start)
  const onBookmark = () => {
    if (marked) return
    setLocalMarks((m) => [...m, start])
    flash('Marque-page ajouté')
    startTransition(async () => {
      const res = await addPdfBookmark(start)
      if (!res?.ok) {
        setLocalMarks((m) => m.filter((x) => x !== start))
        flash('Impossible d’ajouter le marque-page')
      }
    })
  }

  const atEnd = numPages > 0 && spread[spread.length - 1] >= numPages
  const label = spread.length > 1 ? `${spread[0]}–${spread[1]}` : String(spread[0] ?? '')

  return (
    <div
      className={`reader pdf-protected${hidden ? ' is-hidden' : ''}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <header className="reader-head">
        <Link href="/espace-membre" className="reader-back" aria-label="Retour à ma bibliothèque">
          <IconArrowLeft />
        </Link>
        <p className="reader-crumb">
          <span>{bookTitle}</span>
          <span className="reader-sep" aria-hidden="true">
            \
          </span>
          <strong>Édition numérique</strong>
        </p>
        <div className="reader-tools">
          <button
            type="button"
            className={`reader-tool${marked ? ' is-on' : ''}`}
            onClick={onBookmark}
            disabled={!doc}
            aria-pressed={marked}
            aria-label={marked ? 'Page déjà marquée' : 'Marquer cette page'}
            title={marked ? 'Page marquée' : 'Marquer cette page'}
          >
            <IconBookmark />
          </button>
          <span className="reader-page" aria-live="polite">
            {numPages ? label : '…'}
            {numPages > 0 && <small> / {numPages}</small>}
          </span>
        </div>
      </header>

      <div className="reader-stage">
        <button type="button" className="reader-arrow prev" onClick={() => go(-1)} disabled={!doc || start <= 1} aria-label="Pages précédentes">
          <IconChevron dir="left" />
        </button>
        <div
          ref={stageRef}
          className="pdf-stage"
          onPointerDown={(e) => {
            if (e.pointerType !== 'mouse') touchX.current = e.clientX
          }}
          onPointerUp={(e) => {
            if (touchX.current === null) return
            const dx = e.clientX - touchX.current
            touchX.current = null
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
          }}
        >
          {error ? (
            <div className="pdf-message">
              <p>
                {error === 'expired'
                  ? 'Votre session de lecture a expiré.'
                  : 'Le livre n’a pas pu être chargé. Vérifiez votre connexion.'}
              </p>
              <button type="button" className="btn btn-dark btn-sm" onClick={() => window.location.reload()}>
                Recharger
              </button>
            </div>
          ) : !doc || !box.w ? (
            <div className="pdf-message">
              <span className="pdf-spinner" aria-hidden="true" />
              <p>Ouverture du livre…</p>
            </div>
          ) : (
            <div className="pdf-spread" style={{ gap: GAP }}>
              {spread.map((n) => (
                <PdfPage key={n} doc={doc} num={n} box={box} reader={reader} />
              ))}
            </div>
          )}
          {doc && tag.time && (
            <span className="pdf-tag" aria-hidden="true" style={{ left: `${tag.x}%`, top: `${tag.y}%` }}>
              {reader.name} · {reader.email} · {tag.time}
            </span>
          )}
          {hidden && doc && (
            <button type="button" className="pdf-shield" onClick={() => window.focus()}>
              <strong>Lecture masquée</strong>
              <span>Les captures et enregistrements d’écran du livre ne sont pas autorisés. Cliquez ici pour reprendre.</span>
            </button>
          )}
        </div>
        <button type="button" className="reader-arrow next" onClick={() => go(1)} disabled={!doc || atEnd} aria-label="Pages suivantes">
          <IconChevron dir="right" />
        </button>
      </div>

      <div className="reader-strip-wrap">
        <div ref={stripRef} className="reader-strip" role="group" aria-label="Pages du livre">
          {doc &&
            Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
              <Thumb key={n} doc={doc} num={n} active={spread.includes(n)} marked={localMarks.includes(n)} onClick={() => setPage(n)} />
            ))}
        </div>
      </div>

      {toast && (
        <p className="reader-toast" role="status">
          {toast}
        </p>
      )}
    </div>
  )
}
