import { load } from 'cheerio'
import fetch from 'node-fetch'

// Map from exact client name strings on the page to internal keys
const clientNameMap = {
  'Apple Mail 10': 'apple-mail',
  'Outlook 2000\u201303': 'outlook-legacy', // en-dash: Outlook 2000–03
  'Outlook 2007\u201316': 'outlook',         // en-dash: Outlook 2007–16
  'iOS 11 Mail': 'apple-ios',
  'Outlook.com': 'outlook-web',
  'Yahoo! Mail': 'yahoo-mail',
  'Gmail': 'gmail',
  'Gmail Android app': 'gmail-android',
}

function parsePropertyPage(html) {
  const $ = load(html)
  const data = {}

  $('#detail .client-list li').each((idx, el) => {
    const $li = $(el)
    const $span = $li.find('span.works')

    // Get client name: full text of <li> minus child element text, trimmed
    // The structure is: <li><span ...></span> ClientName<p>optional note</p></li>
    // Clone and remove children to get just text nodes
    const $clone = $li.clone()
    $clone.find('span, p').remove()
    const clientName = $clone.text().trim()

    const internalKey = clientNameMap[clientName]
    if (!internalKey) {
      // Not a client we care about, skip
      return
    }

    if ($span.hasClass('tick')) {
      data[internalKey] = true
    } else if ($span.hasClass('cross')) {
      data[internalKey] = false
    } else if ($span.hasClass('info')) {
      const note = $li.find('p').text().trim()
      data[internalKey] = note || true
    }
  })

  return data
}

function extractPropertyUrls(html) {
  const $ = load(html)
  const urls = new Set()

  $('a.menuitem').each((idx, el) => {
    const href = $(el).attr('href')
    if (href && href.includes('/css/') && !href.includes('/css/email-client/')) {
      urls.add(href)
    }
  })

  return Array.from(urls)
}

function slugToPropertyName(url) {
  // URL format: https://www.campaignmonitor.com/css/{category}/{property-slug}/
  const match = url.match(/\/css\/[^/]+\/([^/]+)\/$/)
  return match ? match[1] : null
}

async function scrapeAll() {
  // Fetch main page and extract all property URLs
  const mainRes = await fetch('https://www.campaignmonitor.com/css/')
  const mainHtml = await mainRes.text()
  const urls = extractPropertyUrls(mainHtml)

  const props = {}

  for (const url of urls) {
    const propName = slugToPropertyName(url)
    if (!propName) {
      continue
    }

    // Skip non-CSS-property pages
    if (propName === 'partial-support-on-table-elements') {
      continue
    }

    try {
      const res = await fetch(url)
      const html = await res.text()
      const data = parsePropertyPage(html)

      // Only add if we got at least one of our tracked clients
      if (Object.keys(data).length === 0) {
        continue
      }

      // Handle background shorthand: the site has individual background-* pages;
      // use 'background' only from the /css/color-background/background/ page
      if (Object.prototype.hasOwnProperty.call(props, propName)) {
        if (propName === 'background') {
          // skip duplicate — keep the first one scraped
          continue
        }
        // For all other properties, last-write wins (shouldn't happen normally)
      }

      // Expand border/padding/margin shorthand to include direction variants
      if (propName === 'border' || propName === 'padding' || propName === 'margin') {
        ;['-left', '-right', '-top', '-bottom'].forEach((suffix) => {
          if (!Object.prototype.hasOwnProperty.call(props, propName + suffix)) {
            props[propName + suffix] = data
          }
        })
      }

      props[propName] = data
    } catch (err) {
      process.stderr.write(`Warning: failed to fetch ${url}: ${err.message}\n`)
    }
  }

  // We handle font-size iOS quirk in the default Email component
  if (props['font-size']) {
    props['font-size']['apple-ios'] = true
  }

  return props
}

scrapeAll()
  .then((props) => {
    const propsJSON = JSON.stringify(props)
    process.stdout.write(propsJSON)
  })
  .catch((err) => {
    console.error(err) // eslint-disable-line no-console
    process.exit(1)
  })
