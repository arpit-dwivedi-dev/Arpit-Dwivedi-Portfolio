// Run with: npx sanity exec migrations/seed.ts --with-user-token
// Pushes the site's existing bilingual content (../metadata.json + ../src/content/hi.ts)
// into the `siteContent` singleton document, so the Studio starts pre-populated
// instead of empty.
import {getCliClient} from 'sanity/cli'
import en from '../../metadata.json'
// hi.ts is a .ts module (not JSON) — sanity exec runs through esbuild, which
// can import it directly.
// eslint-disable-next-line @typescript-eslint/no-var-requires
import {hiContent as hi} from '../../src/content/hi'

const client = getCliClient()

const t = (enVal: string, hiVal: string) => ({en: enVal, hi: hiVal})

const localizeArray = <T, R>(enArr: T[], hiArr: T[], mapItem: (en: T, hi: T) => R): R[] =>
  enArr.map((enItem, i) => mapItem(enItem, hiArr[i]))

const enC = en.content as any
const hiC = hi as any

const doc = {
  _id: 'siteContent',
  _type: 'siteContent',
  navLinks: localizeArray(enC.navLinks, hiC.navLinks, (e: any, h: any) => ({
    name: t(e.name, h.name),
    href: e.href,
  })),
  nav: {
    ariaGithub: t(enC.nav.ariaGithub, hiC.nav.ariaGithub),
    ariaLinkedin: t(enC.nav.ariaLinkedin, hiC.nav.ariaLinkedin),
    ariaOpenMenu: t(enC.nav.ariaOpenMenu, hiC.nav.ariaOpenMenu),
    ariaCloseMenu: t(enC.nav.ariaCloseMenu, hiC.nav.ariaCloseMenu),
    ariaLanguage: t(enC.nav.ariaLanguage, hiC.nav.ariaLanguage),
    langEnglishNative: t(enC.nav.langEnglishNative, hiC.nav.langEnglishNative),
    langHindiNative: t(enC.nav.langHindiNative, hiC.nav.langHindiNative),
    langHindiGloss: t(enC.nav.langHindiGloss, hiC.nav.langHindiGloss),
    langEnglishGloss: t(enC.nav.langEnglishGloss, hiC.nav.langEnglishGloss),
  },
  techStack: enC.techStack,
  services: localizeArray(enC.services, hiC.services, (e: any, h: any) => ({
    title: t(e.title, h.title),
    description: t(e.description, h.description),
    highlights: localizeArray(e.highlights, h.highlights, (eh: string, hh: string) => t(eh, hh)),
  })),
  projects: localizeArray(enC.projects, hiC.projects, (e: any, h: any) => ({
    title: e.title,
    subtitle: e.subtitle ? t(e.subtitle, h.subtitle) : undefined,
    description: t(e.description, h.description),
    metrics: e.metrics
      ? localizeArray(e.metrics, h.metrics, (em: any, hm: any) => ({value: em.value, label: t(em.label, hm.label)}))
      : [],
    tags: e.tags,
    featured: Boolean(e.featured),
    link: e.link,
  })),
  impactMetrics: localizeArray(enC.impactMetrics, hiC.impactMetrics, (e: any, h: any) => ({
    value: e.value,
    label: t(e.label, h.label),
  })),
  hero: {
    badge: t(enC.hero.badge, hiC.hero.badge),
    title: t(enC.hero.title, hiC.hero.title),
    titleAccent: t(enC.hero.titleAccent, hiC.hero.titleAccent),
    subtitle: t(enC.hero.subtitle, hiC.hero.subtitle),
    buttons: {
      projects: t(enC.hero.buttons.projects, hiC.hero.buttons.projects),
      contact: t(enC.hero.buttons.contact, hiC.hero.buttons.contact),
    },
    stats: localizeArray(enC.hero.stats, hiC.hero.stats, (e: any, h: any) => ({value: e.value, label: t(e.label, h.label)})),
    terminal: {
      filename: enC.hero.terminal.filename,
      code: {
        name: enC.hero.terminal.code.name,
        role: t(enC.hero.terminal.code.role, hiC.hero.terminal.code.role),
        stack: enC.hero.terminal.code.stack,
        mission: t(enC.hero.terminal.code.mission, hiC.hero.terminal.code.mission),
      },
      systemLoad: t(enC.hero.terminal.systemLoad, hiC.hero.terminal.systemLoad),
      welcomeLine1: t(enC.hero.terminal.welcomeLine1, hiC.hero.terminal.welcomeLine1),
      welcomeLine2: t(enC.hero.terminal.welcomeLine2, hiC.hero.terminal.welcomeLine2),
      inputPlaceholder: t(enC.hero.terminal.inputPlaceholder, hiC.hero.terminal.inputPlaceholder),
      cleared: t(enC.hero.terminal.cleared, hiC.hero.terminal.cleared),
      notFound: t(enC.hero.terminal.notFound, hiC.hero.terminal.notFound),
      ariaInteractiveTerminal: t(enC.hero.terminal.ariaInteractiveTerminal, hiC.hero.terminal.ariaInteractiveTerminal),
      ariaSendCommand: t(enC.hero.terminal.ariaSendCommand, hiC.hero.terminal.ariaSendCommand),
    },
    terminalCommands: {
      about: t(enC.hero.terminalCommands.about, hiC.hero.terminalCommands.about),
      skills: t(enC.hero.terminalCommands.skills, hiC.hero.terminalCommands.skills),
      projects: t(enC.hero.terminalCommands.projects, hiC.hero.terminalCommands.projects),
      contact: t(enC.hero.terminalCommands.contact, hiC.hero.terminalCommands.contact),
      whoami: t(enC.hero.terminalCommands.whoami, hiC.hero.terminalCommands.whoami),
      location: t(enC.hero.terminalCommands.location, hiC.hero.terminalCommands.location),
      help: t(enC.hero.terminalCommands.help, hiC.hero.terminalCommands.help),
      exit: t(enC.hero.terminalCommands.exit, hiC.hero.terminalCommands.exit),
    },
  },
  about: {
    label: t(enC.about.label, hiC.about.label),
    title: t(enC.about.title, hiC.about.title),
    titleAccent: t(enC.about.titleAccent, hiC.about.titleAccent),
    paragraphs: localizeArray(enC.about.paragraphs, hiC.about.paragraphs, (e: string, h: string) => t(e, h)),
    features: localizeArray(enC.about.features, hiC.about.features, (e: string, h: string) => t(e, h)),
    card: {
      est: t(enC.about.card.est, hiC.about.card.est),
      location: t(enC.about.card.location, hiC.about.card.location),
      locationLabel: t(enC.about.card.locationLabel, hiC.about.card.locationLabel),
      expertise: localizeArray(enC.about.card.expertise, hiC.about.card.expertise, (e: any, h: any) => ({
        title: t(e.title, h.title),
        subtitle: t(e.subtitle, h.subtitle),
      })),
    },
  },
  techStackSection: {
    label: t(enC.techStackSection.label, hiC.techStackSection.label),
    title: t(enC.techStackSection.title, hiC.techStackSection.title),
    titleAccent: t(enC.techStackSection.titleAccent, hiC.techStackSection.titleAccent),
    categories: {
      frontend: t(enC.techStackSection.categories.frontend, hiC.techStackSection.categories.frontend),
      backend: t(enC.techStackSection.categories.backend, hiC.techStackSection.categories.backend),
      database: t(enC.techStackSection.categories.database, hiC.techStackSection.categories.database),
      devops: t(enC.techStackSection.categories.devops, hiC.techStackSection.categories.devops),
    },
  },
  devops: {
    label: t(enC.devops.label, hiC.devops.label),
    title: t(enC.devops.title, hiC.devops.title),
    titleAccent: t(enC.devops.titleAccent, hiC.devops.titleAccent),
    description: t(enC.devops.description, hiC.devops.description),
    list: localizeArray(enC.devops.list, hiC.devops.list, (e: string, h: string) => t(e, h)),
  },
  localTrust: {
    label: t(enC.localTrust.label, hiC.localTrust.label),
    title: t(enC.localTrust.title, hiC.localTrust.title),
    titleAccent: t(enC.localTrust.titleAccent, hiC.localTrust.titleAccent),
    description: t(enC.localTrust.description, hiC.localTrust.description),
    phone: enC.localTrust.phone,
    serviceArea: t(enC.localTrust.serviceArea, hiC.localTrust.serviceArea),
    callLabel: t(enC.localTrust.callLabel, hiC.localTrust.callLabel),
    serviceAreaLabel: t(enC.localTrust.serviceAreaLabel, hiC.localTrust.serviceAreaLabel),
    testimonials: localizeArray(enC.localTrust.testimonials, hiC.localTrust.testimonials, (e: any, h: any) => ({
      quote: t(e.quote, h.quote),
      name: t(e.name, h.name),
      business: t(e.business, h.business),
    })),
  },
  contact: {
    label: t(enC.contact.label, hiC.contact.label),
    title: t(enC.contact.title, hiC.contact.title),
    titleAccent: t(enC.contact.titleAccent, hiC.contact.titleAccent),
    description: t(enC.contact.description, hiC.contact.description),
    email: enC.contact.email,
    linkedin: enC.contact.linkedin,
    github: enC.contact.github,
    whatsapp: {
      number: enC.contact.whatsapp.number,
      message: t(enC.contact.whatsapp.message, hiC.contact.whatsapp.message),
    },
    whatsappLabel: t(enC.contact.whatsappLabel, hiC.contact.whatsappLabel),
    mailSubjectTemplate: t(enC.contact.mailSubjectTemplate, hiC.contact.mailSubjectTemplate),
    statusSent: t(enC.contact.statusSent, hiC.contact.statusSent),
    statusError: t(enC.contact.statusError, hiC.contact.statusError),
    form: {
      name: t(enC.contact.form.name, hiC.contact.form.name),
      email: t(enC.contact.form.email, hiC.contact.form.email),
      message: t(enC.contact.form.message, hiC.contact.form.message),
      button: t(enC.contact.form.button, hiC.contact.form.button),
      sending: t(enC.contact.form.sending, hiC.contact.form.sending),
      namePlaceholder: t(enC.contact.form.namePlaceholder, hiC.contact.form.namePlaceholder),
      emailPlaceholder: t(enC.contact.form.emailPlaceholder, hiC.contact.form.emailPlaceholder),
      messagePlaceholder: t(enC.contact.form.messagePlaceholder, hiC.contact.form.messagePlaceholder),
      errors: {
        nameRequired: t(enC.contact.form.errors.nameRequired, hiC.contact.form.errors.nameRequired),
        emailRequired: t(enC.contact.form.errors.emailRequired, hiC.contact.form.errors.emailRequired),
        emailInvalid: t(enC.contact.form.errors.emailInvalid, hiC.contact.form.errors.emailInvalid),
        messageRequired: t(enC.contact.form.errors.messageRequired, hiC.contact.form.errors.messageRequired),
      },
    },
  },
  featuredProject: {
    label: t(enC.featuredProject.label, hiC.featuredProject.label),
    title: t(enC.featuredProject.title, hiC.featuredProject.title),
    titleAccent: t(enC.featuredProject.titleAccent, hiC.featuredProject.titleAccent),
    description: t(enC.featuredProject.description, hiC.featuredProject.description),
    button: t(enC.featuredProject.button, hiC.featuredProject.button),
    visual: {
      ocr: t(enC.featuredProject.visual.ocr, hiC.featuredProject.visual.ocr),
      ai: t(enC.featuredProject.visual.ai, hiC.featuredProject.visual.ai),
      badge: t(enC.featuredProject.visual.badge, hiC.featuredProject.visual.badge),
    },
  },
  servicesSection: {
    label: t(enC.servicesSection.label, hiC.servicesSection.label),
    title: t(enC.servicesSection.title, hiC.servicesSection.title),
    titleAccent: t(enC.servicesSection.titleAccent, hiC.servicesSection.titleAccent),
  },
  projectsSection: {
    label: t(enC.projectsSection.label, hiC.projectsSection.label),
    title: t(enC.projectsSection.title, hiC.projectsSection.title),
    titleAccent: t(enC.projectsSection.titleAccent, hiC.projectsSection.titleAccent),
    description: t(enC.projectsSection.description, hiC.projectsSection.description),
    pageTitle: t(enC.projectsSection.pageTitle, hiC.projectsSection.pageTitle),
    pageTitleAccent: t(enC.projectsSection.pageTitleAccent, hiC.projectsSection.pageTitleAccent),
    pageDescription: t(enC.projectsSection.pageDescription, hiC.projectsSection.pageDescription),
    backToHome: t(enC.projectsSection.backToHome, hiC.projectsSection.backToHome),
    viewAll: t(enC.projectsSection.viewAll, hiC.projectsSection.viewAll),
  },
  projectCard: {
    viewGithub: t(enC.projectCard.viewGithub, hiC.projectCard.viewGithub),
    viewLive: t(enC.projectCard.viewLive, hiC.projectCard.viewLive),
    viewDetails: t(enC.projectCard.viewDetails, hiC.projectCard.viewDetails),
  },
  achievementsSection: {
    label: t(enC.achievementsSection.label, hiC.achievementsSection.label),
    title: t(enC.achievementsSection.title, hiC.achievementsSection.title),
    titleAccent: t(enC.achievementsSection.titleAccent, hiC.achievementsSection.titleAccent),
  },
  architecture: {
    loadBalancer: t(enC.architecture.loadBalancer, hiC.architecture.loadBalancer),
    nodeApp: t(enC.architecture.nodeApp, hiC.architecture.nodeApp),
    database: t(enC.architecture.database, hiC.architecture.database),
  },
  footer: {
    rights: t(enC.footer.rights, hiC.footer.rights),
    techNote: t(enC.footer.techNote, hiC.footer.techNote),
  },
}

async function run() {
  const result = await client.createOrReplace(doc)
  console.log('Seeded siteContent document:', result._id)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
