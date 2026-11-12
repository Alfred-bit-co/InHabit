/** Pays africains : code ISO 3166-1 numérique (utilisé par la carte) et nom français. */
export const AFRICAN_COUNTRIES: { code: string; name: string }[] = [
  { code: '710', name: 'Afrique du Sud' },
  { code: '012', name: 'Algérie' },
  { code: '024', name: 'Angola' },
  { code: '204', name: 'Bénin' },
  { code: '072', name: 'Botswana' },
  { code: '854', name: 'Burkina Faso' },
  { code: '108', name: 'Burundi' },
  { code: '120', name: 'Cameroun' },
  { code: '132', name: 'Cap-Vert' },
  { code: '140', name: 'Centrafrique' },
  { code: '174', name: 'Comores' },
  { code: '178', name: 'Congo' },
  { code: '384', name: "Côte d'Ivoire" },
  { code: '262', name: 'Djibouti' },
  { code: '818', name: 'Égypte' },
  { code: '232', name: 'Érythrée' },
  { code: '748', name: 'Eswatini' },
  { code: '231', name: 'Éthiopie' },
  { code: '266', name: 'Gabon' },
  { code: '270', name: 'Gambie' },
  { code: '288', name: 'Ghana' },
  { code: '324', name: 'Guinée' },
  { code: '624', name: 'Guinée-Bissau' },
  { code: '226', name: 'Guinée équatoriale' },
  { code: '404', name: 'Kenya' },
  { code: '426', name: 'Lesotho' },
  { code: '430', name: 'Liberia' },
  { code: '434', name: 'Libye' },
  { code: '450', name: 'Madagascar' },
  { code: '454', name: 'Malawi' },
  { code: '466', name: 'Mali' },
  { code: '504', name: 'Maroc' },
  { code: '480', name: 'Maurice' },
  { code: '478', name: 'Mauritanie' },
  { code: '508', name: 'Mozambique' },
  { code: '516', name: 'Namibie' },
  { code: '562', name: 'Niger' },
  { code: '566', name: 'Nigeria' },
  { code: '800', name: 'Ouganda' },
  { code: '180', name: 'RD Congo' },
  { code: '646', name: 'Rwanda' },
  { code: '732', name: 'Sahara occidental' },
  { code: '678', name: 'Sao Tomé-et-Principe' },
  { code: '686', name: 'Sénégal' },
  { code: '690', name: 'Seychelles' },
  { code: '694', name: 'Sierra Leone' },
  { code: '706', name: 'Somalie' },
  { code: '729', name: 'Soudan' },
  { code: '728', name: 'Soudan du Sud' },
  { code: '834', name: 'Tanzanie' },
  { code: '148', name: 'Tchad' },
  { code: '768', name: 'Togo' },
  { code: '788', name: 'Tunisie' },
  { code: '894', name: 'Zambie' },
  { code: '716', name: 'Zimbabwe' },
]

export const OUTSIDE_AFRICA = 'hors-afrique'

export const AFRICAN_CODES = new Set(AFRICAN_COUNTRIES.map((c) => c.code))

export const countryName = (code?: string | null, other?: string | null) => {
  if (!code) return ''
  if (code === OUTSIDE_AFRICA) return other || 'International'
  return AFRICAN_COUNTRIES.find((c) => c.code === code)?.name ?? ''
}

export const countryOptions = [
  ...AFRICAN_COUNTRIES.map((c) => ({ label: c.name, value: c.code })),
  { label: 'Hors Afrique (préciser)', value: OUTSIDE_AFRICA },
]
