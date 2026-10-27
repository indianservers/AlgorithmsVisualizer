import { allModules } from '../algorithms'
import { categories, categoryPages } from '../data/catalog'
import { algorithmPath } from '../utils/routing'
import { languages } from '../i18n/languages'
import { sitemapLocales, sitemapPath } from './routes'

export type SitemapTranslate = (source: string) => string
export const sitemapCopy = {
  title: 'Sitemap and topic directory',
  intro: 'Find every algorithm, its purpose, an interactive visualization, and a detailed theory guide.',
  visualization: 'Visualization',
  theory: 'Theory guide',
  home: 'Home',
  languages: 'Sitemap languages',
  directory: 'Full sitemap',
  xml: 'XML sitemap',
  json: 'Machine-readable catalog',
  agents: 'AI reading guide',
}
export const sitemapGroups = categories.map((category) => ({
  id: categoryPages[category].slug,
  name: category,
  description: categoryPages[category].subtitle,
  path: '/' + categoryPages[category].slug,
  lessons: allModules
    .filter((module) => module.category === category)
    .map((module) => ({
      id: module.id,
      name: module.name,
      description: module.summary,
      path: algorithmPath(module),
      theoryPath: algorithmPath(module) + '/learn',
      complexity: module.complexity,
    })),
}))
export const origin = 'https://algorithms.aimersociety.com'
export function sitemapCatalog(locale: string, t: SitemapTranslate) {
  const text = (source: string) => ({ text: t(source), language: t(source) === source ? 'en-IN' : locale })
  return {
    schemaVersion: 1,
    name: 'AlgoDrishti',
    url: origin,
    language: locale,
    description: text(sitemapCopy.intro),
    interfaceLanguages: languages.map(({ code, nativeName }) => ({ code, nativeName })),
    localizedDirectories: sitemapLocales.map((code) => ({ language: code, url: origin + sitemapPath(code) })),
    categories: sitemapGroups.map((group) => ({
      id: group.id,
      name: text(group.name),
      description: text(group.description),
      url: origin + group.path,
      lessons: group.lessons.map((lesson) => ({
        id: lesson.id,
        name: text(lesson.name),
        description: text(lesson.description),
        visualizationUrl: origin + lesson.path,
        theoryUrl: origin + lesson.theoryPath,
        complexity: lesson.complexity,
      })),
    })),
  }
}
export function sitemapSchema(locale: string, t: SitemapTranslate, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': origin + path,
    url: origin + path,
    name: t(sitemapCopy.title),
    description: t(sitemapCopy.intro),
    inLanguage: locale,
    isAccessibleForFree: true,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: allModules.length,
      itemListElement: sitemapGroups
        .flatMap((group) => group.lessons)
        .map((lesson, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'WebPage',
            '@id': origin + lesson.theoryPath,
            url: origin + lesson.theoryPath,
            name: t(lesson.name),
            description: t(lesson.description),
            // The directory description is localized; the linked theory page
            // still uses its existing English canonical URL and article text.
            inLanguage: 'en-IN',
          },
        })),
    },
  }
}
