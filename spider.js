import fs from 'fs'
import path from 'path'
import superagent from 'superagent'
import mkdirp from 'mkdirp'
import { urlToFilename } from './utils.js'

export function spider(url, cb) {
    const filename = urlToFilename(url)
    const pathFilename = './html-downloaded/' + filename
    fs.access(pathFilename, err => {
        if (!err || err.code !== 'ENOENT') {
            return cb(null, filename, false)

        }
        downloadFromUrl(url, filename, err => {
            if (err) {
                return cb(err)
            }
            cb(null, filename, true)
        })
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

        const pathFilename = './html-downloaded/' + filename
        saveFile(pathFilename, res.text, err => {
            if (err) {
                return cb(err)
            }
            console.log(`Downloaded and saved: ${url}`)
            cb(null, res.text)
        })
    })
}


