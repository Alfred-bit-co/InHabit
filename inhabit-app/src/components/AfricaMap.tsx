import { geoMercator, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { FeatureCollection, Geometry } from 'geojson'
import type { GeometryCollection, Topology } from 'topojson-specification'
import world from 'world-atlas/countries-110m.json'
import { AFRICAN_CODES, AFRICAN_COUNTRIES } from '@/lib/africa'
import { AfricaMapClient, type MapProject } from './AfricaMapClient'

const WIDTH = 600
const HEIGHT = 640

type Props = { name: string }

/** Calcule (côté serveur) le tracé SVG de chaque pays africain. */
function buildPaths() {
  const topo = world as unknown as Topology<{ countries: GeometryCollection<Props> }>
  const all = feature(topo, topo.objects.countries) as FeatureCollection<Geometry, Props>
  const africa: FeatureCollection<Geometry, Props> = {
    type: 'FeatureCollection',
    features: all.features.filter((f) => AFRICAN_CODES.has(String(f.id))),
  }
  const projection = geoMercator().fitSize([WIDTH, HEIGHT], africa)
  const path = geoPath(projection)
  return africa.features.map((f) => ({
    code: String(f.id),
    name: AFRICAN_COUNTRIES.find((c) => c.code === String(f.id))?.name ?? f.properties.name,
    d: path(f) ?? '',
  }))
}

let cache: ReturnType<typeof buildPaths> | null = null

export function AfricaMap({ projects }: { projects: MapProject[] }) {
  cache ??= buildPaths()
  return <AfricaMapClient paths={cache} projects={projects} width={WIDTH} height={HEIGHT} />
}
