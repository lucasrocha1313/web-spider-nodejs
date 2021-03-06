import fs from 'fs'
import path from 'path'
import superagent from 'superagent'
import mkdirp from 'mkdirp'
import { urlToFilename, getPageLinks } from './utils.js'

export function spider(url, nesting, cb) {
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

    function interate(index) {
        if (index === links.length) {
            return cb()
        }

        spider(links[index], nesting - 1, function (err) {
            if (err) {
                return cb(err)
            }

            interate(index + 1)
        })
    }

    interate(0)
}


