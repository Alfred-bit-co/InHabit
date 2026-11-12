/**
 * Remplit la base avec un compte administrateur et du contenu de démonstration.
 * Usage : npm run seed            (ne fait rien si des projets existent déjà)
 *         SEED_FORCE=1 npm run seed (ajoute quand même le contenu)
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import config from './payload.config'
import { toISOMonth } from './lib/dates'
import type { Project } from './payload-types'

const dirname = path.dirname(fileURLToPath(import.meta.url))
// Les images de l'ancien site se trouvent dans le dossier parent du projet.
const ASSETS = path.resolve(dirname, '../..')

/** Construit un champ « texte riche » (Lexical) à partir de paragraphes. */
const rt = (...paragraphs: string[]) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      textFormat: 0,
      textStyle: '',
      children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
    })),
  },
})

const monthFromNow = (n: number) => {
  const d = new Date()
  return toISOMonth(new Date(d.getFullYear(), d.getMonth() + n, 1))
}

const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000).toISOString()

async function seed() {
  const payload = await getPayload({ config })
  const log = (msg: string) => payload.logger.info(`[seed] ${msg}`)

  /* ───── Administrateur ───── */
  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD
  if (email && password) {
    const existing = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1 })
    if (!existing.docs.length) {
      await payload.create({ collection: 'users', data: { email, password, name: 'Administrateur' } })
      log(`Compte admin créé : ${email}`)
    }
  }

  const projectsCount = await payload.count({ collection: 'projects' })
  if (projectsCount.totalDocs > 0 && !process.env.SEED_FORCE) {
    log('Du contenu existe déjà, rien à ajouter. (SEED_FORCE=1 pour forcer)')
    process.exit(0)
  }

  /* ───── Médias ───── */
  const upload = async (file: string, alt: string) => {
    const filePath = path.join(ASSETS, file)
    if (!fs.existsSync(filePath)) {
      log(`Image introuvable, ignorée : ${file}`)
      return undefined
    }
    const doc = await payload.create({ collection: 'media', data: { alt }, filePath })
    return doc.id
  }

  log('Import des images…')
  const img = {
    portrait: await upload('warrentest.jpeg', 'Portrait de Warren Riad AYITOU'),
    conceptFr: await upload('concept-fr.jpeg', 'Couverture du livre CONCEPT — édition française'),
    conceptEn: await upload('concept-en.jpeg', 'Couverture du livre CONCEPT — édition anglaise'),
    heroMain: await upload('hero-main.jpg', 'Intérieur architectural baigné de lumière'),
    heroSecondary: await upload('hero-secondary.jpg', 'Détail de matériaux et de lumière'),
    heroTertiary: await upload('hero-tertiary.png', 'Perspective architecturale'),
    p1: await upload('projet1.jpg', 'Maison à patio, cour intérieure'),
    p2: await upload('projet2.jpg', 'Pavillon à la façade poreuse'),
    p3: await upload('projet3.jpg', 'Séquence publique ombragée'),
    p4: await upload('project.jpg', 'Maison introvertie, matériaux bruts'),
    page1: await upload('page1.png', 'Double page du livre CONCEPT'),
    page2: await upload('page2.png', 'Double page du livre CONCEPT'),
    page3: await upload('page3.png', 'Double page du livre CONCEPT'),
    futur: await upload('futur.jpg', 'Visuel InHabit'),
  }

  /* ───── Réglages ───── */
  log('Réglages et pages…')
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      siteName: 'InHabit_Archi',
      tagline:
        'Plateforme architecturale contemporaine : chaîne YouTube, livre CONCEPT, projets, recherches et accompagnement.',
      contactEmail: 'contact@inhabit-archi.com',
      location: 'Japon · Afrique de l’Ouest',
      notificationEmail: process.env.ADMIN_EMAIL || undefined,
      youtubeChannelUrl: 'https://www.youtube.com/@InHabit_Archi',
      socials: [
        { platform: 'youtube', url: 'https://www.youtube.com/@InHabit_Archi' },
        { platform: 'instagram', url: 'https://www.instagram.com/' },
        { platform: 'linkedin', url: 'https://www.linkedin.com/' },
      ],
    },
  })

  await payload.updateGlobal({
    slug: 'home',
    data: {
      heroTitle: 'Architecture',
      heroSubtitle: 'begins as',
      heroAccent: 'art',
      heroCta: 'Cliquez pour commencer',
      heroCards: [
        { image: img.portrait!, title: 'Warren AYITOU', line1: 'Architecte & Auteur', line2: 'Japon', link: '/a-propos' },
        { image: img.conceptFr!, title: 'Livre CONCEPT', line1: 'Penser avant de bâtir', line2: 'Disponible', link: '/produits/livre-concept' },
        { image: img.heroMain!, title: 'InHabit_Archi', line1: 'La chaîne YouTube', line2: 'Nouvelle vidéo chaque semaine', link: '/youtube' },
      ].filter((c) => c.image),
      strip: [img.p1, img.p2, img.p3, img.p4].filter(Boolean) as number[],
      introEyebrow: 'La chaîne InHabit_Archi',
      introTitle: 'Questionner l’espace pour mieux l’habiter.',
      introText:
        'InHabit_Archi explore chaque semaine l’architecture, la ville et la pensée spatiale à travers des vidéos courtes et accessibles — entre l’Afrique et le reste du monde. Le site prolonge la chaîne : projets, recherches, livre, concours et accompagnement.',
      stats: [
        { value: '31K+', label: 'vues sur la vidéo la plus regardée' },
        { value: '20+', label: 'architectes interrogés dans CONCEPT' },
        { value: '4', label: 'pays de projets' },
      ],
    },
  })

  await payload.updateGlobal({
    slug: 'youtube-page',
    data: {
      title: 'Penser l’espace, en vidéo.',
      vision:
        'Rendre l’architecture compréhensible et désirable : expliquer les idées derrière les bâtiments, questionner nos façons d’habiter et redonner sa place à une architecture enracinée dans son contexte.',
      editorialLine: [
        { title: 'Afrique & identité', text: 'Retrouver une logique architecturale africaine, entre héritage et modernité.' },
        { title: 'Architecture du monde', text: 'Japon, Asie, Amérique latine : ce que les autres cultures peuvent nous apprendre.' },
        { title: 'Concevoir un projet', text: 'Méthodes, concepts et outils pour passer de l’idée au bâtiment.' },
      ],
      communityTopics: [
        { topic: 'Architecture en terre' },
        { topic: 'Logement abordable' },
        { topic: 'Climat et confort passif' },
        { topic: 'Villes africaines de demain' },
        { topic: 'Le métier d’architecte' },
      ],
    },
  })

  await payload.updateGlobal({
    slug: 'book',
    data: {
      title: 'CONCEPT',
      subtitle: 'Construire une pensée architecturale',
      cover: img.conceptFr,
      pitch:
        'Un livre pour apprendre à concevoir et à construire un concept architectural : inspiration, processus de conception, projet guidé et entretiens avec plus de 20 architectes à travers le monde.',
      presentation: rt(
        'CONCEPT est une exploration intime de l’architecture comme dialogue vivant entre le lieu, la mémoire, le corps et la transformation.',
        'Il s’adresse aux étudiants, aux jeunes architectes et à tous ceux qui croient que l’espace façonne ce que nous devenons.',
      ),
      contents: rt(
        'Introduction · Inspiration et références · Le processus de conception · Projet guidé et mini-projet · Série d’entretiens · Études de cas commentées.',
        'La démarche : partir d’une question, la transformer en idée, puis en espace.',
      ),
      editions: [
        {
          name: 'Édition française',
          format: 'Broché · 240 pages',
          price: '29 €',
          cover: img.conceptFr,
          links: [{ label: 'Commander', url: 'https://www.amazon.fr/' }],
          available: true,
        },
        {
          name: 'English edition',
          format: 'Paperback · 240 pages',
          price: '29 €',
          cover: img.conceptEn,
          links: [{ label: 'Order', url: 'https://www.amazon.com/' }],
          available: true,
        },
        { name: 'Édition numérique', format: 'PDF / ePub', price: '15 €', available: false },
      ],
      excerpts: [
        { image: img.page1!, caption: '+20 architectes à travers le monde' },
        { image: img.page2!, caption: 'Les murs comme mémoire' },
        { image: img.page3!, caption: 'Habiter, c’est devenir' },
      ].filter((e) => e.image),
    },
  })

  await payload.updateGlobal({
    slug: 'coaching',
    data: {
      title: 'Accompagnement CONCEPT',
      intro:
        'Un accompagnement individuel de quatre semaines pour développer votre capacité à concevoir et à construire un concept architectural.',
      price: '250 €',
      durationWeeks: 4,
      description: rt(
        'Chaque mois, un petit groupe de participants est accompagné individuellement pendant quatre semaines.',
        'Une séance par semaine en visio, des exercices entre les séances et un retour personnalisé sur votre projet.',
      ),
      objectives: [
        { text: 'Formuler une intention et la transformer en concept clair' },
        { text: 'Traduire le concept en espaces, en plans et en matières' },
        { text: 'Présenter et défendre son projet avec assurance' },
      ],
      modalities: [
        { text: '4 séances individuelles d’1 heure en visioconférence' },
        { text: 'Exercices guidés et corrections entre les séances' },
        { text: 'Places limitées chaque mois' },
      ],
      months: [1, 2, 3].map((n) => ({ month: monthFromNow(n), capacity: 4, displayedPlaces: 2, open: true })),
    },
  })

  await payload.updateGlobal({
    slug: 'appointment-settings',
    data: {
      title: 'Rendez-vous architectural',
      intro:
        'Vous avez un projet de construction ? Réservez un premier échange gratuit pour en parler : vos besoins, votre terrain, vos envies.',
      durationMinutes: 30,
      daysAhead: 30,
      minNoticeDays: 1,
      timezoneLabel: 'heure de Paris',
      weekdays: ['2', '4', '6'],
      slots: [{ time: '10:00' }, { time: '14:00' }, { time: '16:30' }],
    },
  })

  await payload.updateGlobal({
    slug: 'about',
    data: {
      title: 'Habiter, questionner, transmettre.',
      intro:
        'InHabit_Archi est une plateforme architecturale née d’une chaîne YouTube : un lieu pour comprendre, débattre et construire une architecture enracinée.',
      history: rt(
        'La chaîne est née d’une envie simple : expliquer l’architecture autrement, avec des mots accessibles et un regard depuis l’Afrique.',
        'Elle réunit aujourd’hui une communauté d’étudiants, d’architectes et de curieux à travers le monde.',
      ),
      vision: rt(
        'Nous n’occupons pas simplement les espaces : nous devenons eux.',
        'Concevoir, c’est écouter le contexte, la matière, le silence et la manière dont les gens habitent le monde.',
      ),
      founder: {
        name: 'Warren Riad AYITOU',
        role: 'Architecte & auteur',
        photo: img.portrait,
        bio: rt(
          'Architecte, auteur et penseur, Warren Riad AYITOU développe un langage architectural enraciné dans la clarté, la présence humaine et la profondeur intellectuelle.',
          'Son travail aborde la conception comme un acte d’écoute disciplinée : du contexte, du matériau, du silence, et de la manière dont les gens habitent le monde.',
        ),
      },
      collaborators: [
        { name: 'Collaborateur·rice', role: 'Montage vidéo' },
        { name: 'Contributeur·rice', role: 'Recherche & rédaction' },
      ],
      partners: [{ name: 'Partenaire 1' }, { name: 'Partenaire 2' }, { name: 'Partenaire 3' }],
    },
  })

  /* ───── YouTube ───── */
  log('Vidéos…')
  const themes = []
  for (const [i, name] of ['Afrique & identité', 'Architecture du monde', 'Concevoir un projet'].entries()) {
    themes.push(await payload.create({ collection: 'video-themes', data: { name, order: i } }))
  }
  const videos = [
    { url: 'https://www.youtube.com/watch?v=LMS2gV63nfI', title: 'L’Afrique s’éloigne de sa propre logique architecturale', theme: [themes[0].id], days: -20 },
    { url: 'https://www.youtube.com/watch?v=2jltS_wxV_o', title: 'Le futur de l’architecture est en ASIE', theme: [themes[1].id], days: -40 },
    { url: 'https://www.youtube.com/watch?v=Wsjv4sCY6xw', title: 'La solution que l’Afrique, le Japon et l’Amérique latine ont tous trouvée seuls', theme: [themes[0].id, themes[1].id], days: -60 },
  ]
  for (const v of videos) {
    await payload.create({
      collection: 'videos',
      data: { url: v.url, title: v.title, theme: v.theme, publishedAt: daysFromNow(v.days) },
    })
  }

  /* ───── Projets ───── */
  log('Projets…')
  const projects = [
    {
      title: 'Maison Cour d’Ivoire',
      summary: 'Une composition résidentielle apaisée, structurée par une lumière filtrée et des jardins intérieurs.',
      country: '204' as Project['country'], city: 'Cotonou', year: '2026', status: 'en-cours' as const, cover: img.p1, featured: true,
    },
    {
      title: 'Pavillon Bronze',
      summary: 'Une enveloppe commerciale raffinée, avec un rythme de matériaux chaleureux et une façade poreuse.',
      country: '384' as Project['country'], city: 'Abidjan', year: '2025', status: 'realise' as const, cover: img.p2, featured: true,
    },
    {
      title: 'Colonne civique linéaire',
      summary: 'Une séquence publique reliant mouvement, ombre, pause et vie collective.',
      country: '768' as Project['country'], city: 'Lomé', year: '2025', status: 'concours' as const, cover: img.p3, featured: true,
    },
    {
      title: 'The Inward House',
      summary: 'Une étude sur la retenue, le calme des matériaux et l’introspection spatiale.',
      country: '288' as Project['country'], city: 'Accra', year: '2024', status: 'etude' as const, cover: img.p4, featured: false,
    },
  ]
  for (const [i, p] of projects.entries()) {
    if (!p.cover) continue
    await payload.create({
      collection: 'projects',
      data: {
        ...p,
        cover: p.cover,
        order: i,
        role: 'Architecte concepteur',
        context: 'Contexte du projet à compléter : site, climat, enjeux urbains et sociaux.',
        program: 'Programme à compléter : surfaces, usages, nombre d’usagers.',
        approach: rt('Démarche conceptuelle à compléter depuis l’administration.'),
        gallery: [img.heroMain, img.heroSecondary].filter(Boolean).map((id, k) => ({
          image: id!,
          kind: k ? ('perspective' as const) : ('photo' as const),
          caption: k ? 'Perspective' : 'Vue d’ensemble',
        })),
      },
    })
  }

  /* ───── Recherche, concours, actualités ───── */
  log('Publications, concours et actualités…')
  await payload.create({
    collection: 'publications',
    data: {
      title: 'Retrouver une logique architecturale africaine',
      type: 'article',
      date: daysFromNow(-15),
      summary: 'Réflexion sur l’identité spatiale africaine et la nécessité d’une architecture enracinée.',
      cover: img.heroTertiary,
      content: rt('Texte de l’article à compléter depuis l’administration.'),
    },
  })
  await payload.create({
    collection: 'publications',
    data: {
      title: 'Climat et confort passif en Afrique de l’Ouest',
      type: 'en-cours',
      date: daysFromNow(-5),
      summary: 'Travail de recherche en cours sur les stratégies bioclimatiques traditionnelles.',
      cover: img.heroSecondary,
    },
  })

  await payload.create({
    collection: 'events',
    data: {
      title: 'Concours InHabit 2027 — Habiter la chaleur',
      type: 'concours',
      status: 'a-venir',
      startDate: daysFromNow(30),
      endDate: daysFromNow(90),
      location: 'En ligne',
      summary: 'Un concours d’idées ouvert aux étudiants et jeunes architectes : concevoir un habitat frais sans climatisation.',
      cover: img.heroTertiary,
      content: rt('Présentation détaillée du concours à compléter.'),
      modalities: rt('Ouvert à tous les étudiants et architectes de moins de 35 ans. Rendu : 2 planches A1.'),
    },
  })
  await payload.create({
    collection: 'events',
    data: {
      title: 'Conférence : l’architecture comme acte d’écoute',
      type: 'conference',
      status: 'a-venir',
      startDate: daysFromNow(21),
      location: 'Lomé, Togo',
      summary: 'Une conférence autour du livre CONCEPT et de la démarche de conception.',
      cover: img.futur,
    },
  })

  const news = [
    { title: 'Le livre CONCEPT est disponible', type: 'annonce' as const, excerpt: 'Les éditions française et anglaise sont disponibles à la commande.', cover: img.conceptFr, days: -3 },
    { title: 'Lancement du concours InHabit 2027', type: 'concours' as const, excerpt: 'Inscriptions bientôt ouvertes : concevoir un habitat frais sans climatisation.', cover: img.heroTertiary, days: -7 },
    { title: 'Conférence à Lomé', type: 'conference' as const, excerpt: 'Rendez-vous pour une conférence autour de la démarche de conception.', cover: img.futur, days: -12 },
  ]
  for (const n of news) {
    await payload.create({
      collection: 'news',
      data: { title: n.title, type: n.type, excerpt: n.excerpt, cover: n.cover, date: daysFromNow(n.days) },
    })
  }

  log('Terminé ✔')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
