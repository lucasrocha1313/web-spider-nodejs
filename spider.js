import fs from 'fs'
import path from 'path'
import superagent from 'superagent'
import mkdirp from 'mkdirp'
import { urlToFilename, getPageLinks } from './utils.js'

const spidering = new Set()
export function spider(url, nesting, queue) {
    if(spidering.has(url)) {
        return
    }    
    spidering.add(url)
    
    queue.pushTask((done) => {
        spiderTask(url, nesting, queue, done)
    })
}

export function spiderTask(url, nesting, queue, cb) {
    
    const filename = urlToFilename(url)
    const pathFilename = './html-downloaded/' + filename
    fs.readFile(pathFilename, 'utf8', (err, fileContent) => {
        if (err) {
            if (err.code !== 'ENOENT') {
                console.log(`Error ENOENT: ${url}`)
                return cb(err)
            }

            return downloadFromUrl(url, pathFilename, (err, requestContent) => {
                console.log(`Downloading ${url}`)
                if (err) {
                    console.log(`Error Downloading ${url}`)
                    return cb(err)
                }
                spiderLinks(url, requestContent, nesting, queue)
                return cb()
            })
        }
        console.log(`File already downloaded: ${url}`)
        spiderLinks(url, fileContent, nesting, queue)
        return cb()
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

const spiderLinks = (currentUrl, body, nesting, queue) => {
    if (nesting === 0) {
        return
    }

    const links = getPageLinks(currentUrl, body)
    if (links.length === 0) {
        return
    } 
    
    console.log(`We have ${links.length} links`)

    links.forEach(link => spider(link, nesting-1, queue))
}


