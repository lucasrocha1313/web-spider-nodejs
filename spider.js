import fs from 'fs'
import path from 'path'
import superagent from 'superagent'
import mkdirp from 'mkdirp'
import { urlToFilename, getPageLinks } from './utils.js'

const spidering = new Set()

export function spider(url, nesting, cb) {
    if(spidering.has(url)) {
        return process.nextTick(cb)
    }
    spidering.add(url)
    
    const filename = urlToFilename(url)
    const pathFilename = './html-downloaded/' + filename
    fs.readFile(pathFilename, 'utf8', (err, fileContent) => {
        if (err) {
            if (err.code !== 'ENOENT') {
                return cb(err)
            }

            return downloadFromUrl(url, pathFilename, (err, requestContent) => {
                if (err) {
                    return cb(err)
                }
                spiderLinks(url, requestContent, nesting, cb)
            })
        }

        spiderLinks(url, fileContent, nesting, cb)
    })
}

const saveFile = (pathFilename, contents, cb) => {
    mkdirp(path.dirname(pathFilename)).then(_ => {
        fs.writeFile(pathFilename, contents, cb)
    })
}

const downloadFromUrl = (url, filename, cb) => {
    console.log(`Downloading ${url} into ${filename}`)
    superagent.get(url).end((err, res) => {
        if (err) {
            return cb(err)
        }

        saveFile(filename, res.text, err => {
            if (err) {
                return cb(err)
            }
            console.log(`Downloaded and saved: ${url}`)
            cb(null, res.text)
        })
    })
}

const spiderLinks = (currentUrl, body, nesting, cb) => {
    if (nesting === 0) {
        return process.nextTick(cb)
    }

    const links = getPageLinks(currentUrl, body)

    if (links.length === 0) {
        return process.nextTick(cb)
    }

    let completed = 0
    let hasErrors = false

    function done(err) {
        if(err) {
            hasErrors = true
            return cb(err)
        }

        if(++completed === links.length && !hasErrors) {
            return cb()
        }
    }

    links.forEach(link => spider(link, nesting-1, done))
}


