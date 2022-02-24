import {promises as fsPromises} from 'fs'
import path from 'path'
import superagent from 'superagent'
import mkdirp from 'mkdirp'
import { urlToFilename, getPageLinks } from './utils.js'

export function spider(url, nesting) {
    const filename = urlToFilename(url)
    const pathFilename = './html-downloaded/' + filename
    return fsPromises.readFile(pathFilename, 'utf8')
        .catch(err => {
            if(err.code !== 'ENOENT') {
                throw err
            }

            return downloadFromUrl(url, pathFilename)
        })
        .then(content => spiderLinks(url, content, nesting))    
}

const downloadFromUrl = (url, filename) => {
    console.log(`Downloading ${url} into ${filename}`)
    let content

    return superagent.get(url)
        .then(res => {
            content = res.text
            return mkdirp(path.dirname(filename))
        })
        .then(() => fsPromises.writeFile(filename, content) )
        .then(() => {
            console.log(`Downloaded and saved:${url}`)
            return content
        })
}

const spiderLinks = (currentUrl, body, nesting) => {
    let promise = Promise.resolve()
    if (nesting === 0) {
        return promise
    }

    const links = getPageLinks(currentUrl, body)
    for (const link of links) {
        promise = promise.then(() => spider(link, nesting - 1))
    }

    return promise    
}


