import { useEffect } from 'react'

interface SEOOptions {
  title?: string
  description?: string
  noindex?: boolean
  canonical?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
}

const SITE_NAME = 'ProposalForge'
const BASE_URL = 'https://proposalforge.replit.app'
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`

function setMeta(name: string, content: string, property = false) {
  const attr = property ? 'property' : 'name'
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function useSEO({
  title,
  description,
  noindex = false,
  canonical,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_OG_IMAGE,
}: SEOOptions = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — AI-Powered Proposals & Invoices for Freelancers`
    const metaDesc = description ?? 'Turn your project description into a polished client proposal in under 60 seconds. AI-powered proposals, quotes, and invoices for freelancers.'

    document.title = fullTitle

    setMeta('description', metaDesc)
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow')

    setMeta('og:title', ogTitle ?? fullTitle, true)
    setMeta('og:description', ogDescription ?? metaDesc, true)
    setMeta('og:image', ogImage, true)
    setMeta('og:type', 'website', true)
    setMeta('og:site_name', SITE_NAME, true)

    setMeta('twitter:title', ogTitle ?? fullTitle)
    setMeta('twitter:description', ogDescription ?? metaDesc)
    setMeta('twitter:image', ogImage)
    setMeta('twitter:card', 'summary_large_image')

    if (canonical) {
      setLink('canonical', canonical)
    } else {
      setLink('canonical', `${BASE_URL}${window.location.pathname}`)
    }
  }, [title, description, noindex, canonical, ogTitle, ogDescription, ogImage])
}
