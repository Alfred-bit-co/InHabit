/** Petites icônes au trait pour l'espace membre (aucune dépendance). */
type P = { size?: number }
const svg = (size: number, children: React.ReactNode) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

export const IconLibrary = ({ size = 18 }: P) =>
  svg(size, <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>)
export const IconBook = ({ size = 18 }: P) =>
  svg(size, <><path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5Z" /><path d="M12 6.5v13" /></>)
export const IconBookmark = ({ size = 18 }: P) => svg(size, <path d="M6.5 3.5h11v17l-5.5-4-5.5 4z" />)
export const IconBag = ({ size = 18 }: P) =>
  svg(size, <><path d="M5 8h14l-1 12.5H6z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>)
export const IconUser = ({ size = 18 }: P) => svg(size, <><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5" /></>)
export const IconLogout = ({ size = 18 }: P) =>
  svg(size, <><path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14" /><path d="M10 16.5 5.5 12 10 7.5M5.5 12H15" /></>)
export const IconArrowLeft = ({ size = 18 }: P) => svg(size, <path d="M19 12H5m6-6-6 6 6 6" />)
export const IconChevron = ({ size = 18, dir = 'right' }: P & { dir?: 'left' | 'right' }) =>
  svg(size, <path d={dir === 'right' ? 'm9 5 7 7-7 7' : 'm15 5-7 7 7 7'} />)
export const IconLock = ({ size = 16 }: P) => svg(size, <><rect x="4.5" y="11" width="15" height="9.5" rx="2" /><path d="M8 11V7.5a4 4 0 0 1 8 0V11" /></>)
export const IconText = ({ size = 18 }: P) => svg(size, <><path d="M4 18 9 6l5 12M5.8 14h6.4" /><path d="M15 18l3-7 3 7M15.9 16h4.2" /></>)
