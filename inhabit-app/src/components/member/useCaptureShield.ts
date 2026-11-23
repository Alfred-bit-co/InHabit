import { useEffect, useState } from 'react'

/**
 * Bouclier anti-capture des liseuses. Le web ne peut pas interdire une capture faite par
 * le système ; on masque donc le livre dès qu'un outil de capture a des chances de s'ouvrir :
 * - onglet en arrière-plan ou fenêtre qui perd le focus (outil Capture, OBS, autre appli) ;
 * - touche Windows / Cmd enfoncée (Win+Maj+S, Win+Alt+R, Cmd+Maj+3/4/5…) ;
 * - touche Impr. écran (le presse-papiers est alors écrasé).
 * Renvoie true tant que le livre doit rester masqué.
 */
export function useCaptureShield(flash: (msg: string) => void) {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    let sysKey = false
    let timer = 0
    const update = () => setHidden(document.hidden || !document.hasFocus() || sysKey)
    const release = (ms: number) => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        sysKey = false
        update()
      }, ms)
    }
    const isSystemKey = (e: KeyboardEvent) => e.key === 'Meta' || e.key === 'OS' || e.key === 'PrintScreen'
    const onDown = (e: KeyboardEvent) => {
      if (isSystemKey(e) || (e.metaKey && e.shiftKey)) {
        window.clearTimeout(timer)
        sysKey = true
        update()
      }
    }
    const onUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        sysKey = true
        update()
        navigator.clipboard?.writeText('Capture désactivée — InHabit').catch(() => {})
        flash('Les captures d’écran du livre sont désactivées.')
        release(2000)
      } else if (isSystemKey(e)) {
        release(700)
      }
    }
    update()
    document.addEventListener('visibilitychange', update)
    window.addEventListener('blur', update)
    window.addEventListener('focus', update)
    window.addEventListener('keydown', onDown, true)
    window.addEventListener('keyup', onUp, true)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', update)
      window.removeEventListener('blur', update)
      window.removeEventListener('focus', update)
      window.removeEventListener('keydown', onDown, true)
      window.removeEventListener('keyup', onUp, true)
    }
  }, [flash])
  return hidden
}
