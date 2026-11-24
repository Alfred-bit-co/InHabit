'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, useTransition } from 'react'
import { addBookmark, saveReadingProgress } from '@/app/(frontend)/espace-membre/actions'
import { IconArrowLeft, IconBookmark, IconChevron, IconText } from './icons'
import { useCaptureShield } from './useCaptureShield'

type Props = {
  bookTitle: string
  chapter: { id: number; number: number; title: string }
  prevId: number | null
  nextId: number | null
  nextLocked: boolean
  /** Position de départ dans le chapitre, de 0 (début) à 1 (fin). */
  initialPosition: number
  /** Positions des marque-pages de ce chapitre. */
  marks: number[]
  children: React.ReactNode
}

const FONT_SIZES = [16, 18, 20, 22]
const GAP = 64

/* Taille du texte mémorisée sur cet appareil (petit « store » lu par useSyncExternalStore) */
const DEFAULT_FONT = 1
let memoryFont: number | null = null
const fontListeners = new Set<() => void>()
const readFontIndex = () => {
  if (memoryFont !== null) return memoryFont
  try {
    const raw = localStorage.getItem('reader-font')
    const v = raw === null ? DEFAULT_FONT : Number(raw)
    return Number.isInteger(v) && v >= 0 && v < FONT_SIZES.length ? v : DEFAULT_FONT
  } catch {
    return DEFAULT_FONT
  }
}
const writeFontIndex = (v: number) => {
  memoryFont = v
  try {
    localStorage.setItem('reader-font', String(v))
  } catch {
    /* sans stockage : réglage valable pour cette visite */
  }
  fontListeners.forEach((l) => l())
}
const subscribeFont = (l: () => void) => {
  fontListeners.add(l)
  return () => fontListeners.delete(l)
}

/**
 * Liseuse paginée : le texte du chapitre est découpé en colonnes CSS de la hauteur de l'écran,
 * puis on glisse d'une « double page » à l'autre (une seule colonne sur mobile).
 */
export function BookReader({ bookTitle, chapter, prevId, nextId, nextLocked, initialPosition, marks, children }: Props) {
  const router = useRouter()
  const viewportRef = useRef<HTMLDivElement>(null)
  const flowRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLSpanElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const positionRef = useRef(initialPosition)

  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(0)
  const [stride, setStride] = useState(0)
  const [ready, setReady] = useState(false)
  const fontIndex = useSyncExternalStore(subscribeFont, readFontIndex, () => DEFAULT_FONT)
  const [localMarks, setLocalMarks] = useState(marks)
  const [toast, setToast] = useState('')
  const [, startTransition] = useTransition()
  const flash = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2400)
  }, [])
  // Texte masqué dès qu'une capture peut se préparer
  const hidden = useCaptureShield(flash)

  /** Recalcule les colonnes et le nombre de pages, en gardant la position de lecture. */
  const measure = useCallback(() => {
    const viewport = viewportRef.current
    const flow = flowRef.current
    const end = endRef.current
    if (!viewport || !flow || !end) return
    const w = viewport.clientWidth
    const h = viewport.clientHeight
    const cols = w >= 720 ? 2 : 1
    const colW = (w - GAP * (cols - 1)) / cols
    flow.style.height = `${h}px`
    flow.style.columnWidth = `${colW}px`
    flow.style.columnGap = `${GAP}px`
    const s = w + GAP
    const endLeft = end.getBoundingClientRect().left - flow.getBoundingClientRect().left
    const total = Math.max(1, Math.floor(Math.max(0, endLeft - 1) / s) + 1)
    setStride(s)
    setPages(total)
    setPage(Math.round(positionRef.current * (total - 1)))
    setReady(true)
  }, [])

  useLayoutEffect(() => {
    measure()
    const viewport = viewportRef.current
    if (!viewport) return
    const ro = new ResizeObserver(() => measure())
    ro.observe(viewport)
    // Les polices et les images changent la mise en page une fois chargées
    document.fonts?.ready.then(measure).catch(() => {})
    const imgs = Array.from(flowRef.current?.querySelectorAll('img') ?? [])
    imgs.forEach((img) => img.addEventListener('load', measure))
    return () => {
      ro.disconnect()
      imgs.forEach((img) => img.removeEventListener('load', measure))
    }
  }, [measure])

  // Nouvelle taille de texte : nouvelle pagination
  useLayoutEffect(() => {
    measure()
  }, [fontIndex, measure])

  const position = pages > 1 ? page / (pages - 1) : 0

  // Sauvegarde de la progression (après une courte pause de lecture)
  useEffect(() => {
    if (!ready) return
    positionRef.current = position
    const id = window.setTimeout(() => {
      startTransition(() => saveReadingProgress(chapter.id, position))
    }, 1200)
    return () => window.clearTimeout(id)
  }, [position, ready, chapter.id])

  // Garde la miniature active visible dans la bande du bas
  useEffect(() => {
    const strip = stripRef.current
    const active = strip?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!strip || !active) return
    strip.scrollTo({ left: active.offsetLeft - strip.clientWidth / 2 + active.clientWidth / 2, behavior: 'smooth' })
  }, [page])

  const go = useCallback(
    (delta: number) => {
      const target = page + delta
      if (target < 0) {
        if (prevId) router.push(`/espace-membre/lecture/${prevId}?pos=1`)
        return
      }
      if (target > pages - 1) {
        if (nextId && !nextLocked) router.push(`/espace-membre/lecture/${nextId}`)
        return
      }
      setPage(target)
    },
    [page, pages, prevId, nextId, nextLocked, router],
  )

  // Clavier : flèches, Page précédente / suivante, espace
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
        e.preventDefault()
        go(1)
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
        e.preventDefault()
        go(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  // Glissement au doigt
  const touchX = useRef<number | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') touchX.current = e.clientX
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (touchX.current === null) return
    const dx = e.clientX - touchX.current
    touchX.current = null
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
  }

  /** Premières lignes visibles : servent de titre au marque-page. */
  const visibleExcerpt = () => {
    const viewport = viewportRef.current
    const flow = flowRef.current
    if (!viewport || !flow) return ''
    const box = viewport.getBoundingClientRect()
    const blocks = flow.querySelectorAll('p, h2, h3, h4, li, blockquote')
    for (const el of Array.from(blocks)) {
      const r = el.getBoundingClientRect()
      if (r.right > box.left + 1 && r.left < box.right - 1 && el.textContent?.trim()) {
        return el.textContent.trim().replace(/\s+/g, ' ').slice(0, 140)
      }
    }
    return ''
  }

  const pageOfMark = (pos: number) => Math.round(pos * (pages - 1))
  const marked = localMarks.some((m) => pageOfMark(m) === page)

  const onBookmark = () => {
    if (marked) return
    const pos = position
    setLocalMarks((m) => [...m, pos])
    setToast('Marque-page ajouté')
    window.setTimeout(() => setToast(''), 2200)
    startTransition(async () => {
      const res = await addBookmark(chapter.id, pos, visibleExcerpt())
      if (!res?.ok) {
        setLocalMarks((m) => m.filter((x) => x !== pos))
        setToast('Impossible d’ajouter le marque-page')
      }
    })
  }

  const atEnd = page >= pages - 1

  return (
    <div
      className={`reader reader-protected${hidden ? ' is-hidden' : ''}`}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
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
          <strong>{chapter.title}</strong>
        </p>
        <div className="reader-tools">
          <button
            type="button"
            className="reader-tool"
            onClick={() => writeFontIndex((fontIndex + 1) % FONT_SIZES.length)}
            aria-label={`Taille du texte : ${FONT_SIZES[fontIndex]} pixels. Changer`}
            title="Taille du texte"
          >
            <IconText />
          </button>
          <button
            type="button"
            className={`reader-tool${marked ? ' is-on' : ''}`}
            onClick={onBookmark}
            aria-pressed={marked}
            aria-label={marked ? 'Page déjà marquée' : 'Marquer cette page'}
            title={marked ? 'Page marquée' : 'Marquer cette page'}
          >
            <IconBookmark />
          </button>
          <span className="reader-page" aria-live="polite">
            {page + 1}
            <small> / {pages}</small>
          </span>
        </div>
      </header>

      <div className="reader-stage">
        <button type="button" className="reader-arrow prev" onClick={() => go(-1)} disabled={page === 0 && !prevId} aria-label="Page précédente">
          <IconChevron dir="left" />
        </button>
        <div
          ref={viewportRef}
          className={`reader-viewport${ready ? ' is-ready' : ''}`}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          <div
            ref={flowRef}
            className="reader-flow"
            style={{ transform: `translate3d(${-page * stride}px,0,0)`, fontSize: FONT_SIZES[fontIndex] }}
          >
            <h1 className="reader-chapter-title">
              <small>Chapitre {chapter.number}</small>
              {chapter.title}
            </h1>
            {children}
            <span ref={endRef} className="reader-end" aria-hidden="true" />
          </div>
          {hidden && (
            <button type="button" className="pdf-shield" onClick={() => window.focus()}>
              <strong>Lecture masquée</strong>
              <span>Les captures et enregistrements d’écran du livre ne sont pas autorisés. Cliquez ici pour reprendre.</span>
            </button>
          )}
        </div>
        <button
          type="button"
          className="reader-arrow next"
          onClick={() => go(1)}
          disabled={atEnd && (!nextId || nextLocked)}
          aria-label={atEnd && nextId ? 'Chapitre suivant' : 'Page suivante'}
        >
          <IconChevron dir="right" />
        </button>
      </div>

      <div className="reader-strip-wrap">
        <div ref={stripRef} className="reader-strip" role="group" aria-label="Pages du chapitre">
          {Array.from({ length: pages }, (_, i) => {
            const hasMark = localMarks.some((m) => pageOfMark(m) === i)
            return (
              <button
                key={i}
                type="button"
                className="reader-thumb"
                aria-current={i === page ? 'page' : undefined}
                aria-label={`Aller à la page ${i + 1}`}
                onClick={() => setPage(i)}
              >
                <span className="reader-thumb-lines" aria-hidden="true" />
                <span className="reader-thumb-num">{i + 1}</span>
                {hasMark && <span className="reader-thumb-mark" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
        {atEnd && (
          <div className="reader-next">
            {nextId && !nextLocked ? (
              <Link href={`/espace-membre/lecture/${nextId}`} className="btn btn-dark btn-sm">
                Chapitre suivant <span className="arrow">→</span>
              </Link>
            ) : nextLocked ? (
              <Link href="/produits/livre-concept#editions" className="btn btn-accent btn-sm">
                Lire la suite <span className="arrow">→</span>
              </Link>
            ) : (
              <span className="muted">Fin du livre</span>
            )}
          </div>
        )}
      </div>

      {toast && (
        <p className="reader-toast" role="status">
          {toast}
        </p>
      )}
    </div>
  )
}
