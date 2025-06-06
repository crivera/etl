import type { MetadataRoute } from 'next'
import { BASE_URL } from './robots'
interface Link {
  label: string
  href: string
  public: boolean
  sublinks?: Link[]
  icon?: React.ReactNode
}

type Route = {
  url: string
  lastModified: string
}

export const links = [
  {
    label: 'Home',
    href: '/',
    public: true,
  },
  {
    label: 'Templates',
    href: '/templates',
    public: false,
  },
  {
    label: 'Documents',
    href: '/documents',
    public: false,
  },
  {
    label: 'Collections',
    href: '/collections',
    public: false,
  },
]

export function protectedLinks() {
  const privateHrefs: string[] = []

  function processLinks(linkArray: Link[]) {
    for (const link of linkArray) {
      if (!link.public) {
        privateHrefs.push(link.href)
      }
      if (link.sublinks) {
        processLinks(link.sublinks)
      }
    }
  }

  processLinks(links)
  return privateHrefs
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routesMap: Route[] = links.map((route) => ({
    url: `${BASE_URL}${route.href}`,
    lastModified: new Date().toISOString(),
  }))

  return [...routesMap, { url: '/', lastModified: new Date().toISOString() }]
}
