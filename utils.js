import path from 'path'
import { URL } from 'url'
import slug from 'slug'
import cheerio from 'cheerio'

export function urlToFilename(url) {
    const parsedUrl = new URL(url)
    const urlPath = parsedUrl.pathname.split('/').join('_')
    let filename = path.join(parsedUrl.hostname, urlPath)
    if (!path.extname(filename).match(/htm/)) {
        filename += '.html'
    }

    return filename
}

export const getPageLinks = (currentUrl, body) => {
    //TODO cheerio is not getting the tags
    return Array.from(cheerio.load(body)('a'))
        .map((element => {
            return getLinkUrl(currentUrl, element)
        }))
        .filter(Boolean)
}


const getLinkUrl = (currentUrl, element) => {
    const parsedLink = new URL(element.attribs.href || '', currentUrl)
    const currentParsedUrl = new URL(currentUrl)
    if (parsedLink.hostname !== currentParsedUrl.hostname || !parsedLink.pathname) {
        return null
    }
    return parsedLink.toString()
}