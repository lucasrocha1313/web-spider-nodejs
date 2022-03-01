import {promises as fsPromises} from 'fs'
import path from 'path'
import superagent from 'superagent'
import mkdirp from 'mkdirp'
import { urlToFilename, getPageLinks } from './utils.js'
import { TaskQueue } from './TaskQueue.js'

export function spider(url, nesting, concurrency) {
    const queue = new TaskQueue(concurrency)
    return spiderTask(url, nesting, queue)
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

const spiderLinks = (currentUrl, body, nesting, queue) => {
    if (nesting === 0) {
        return Promise.resolve()
    }

    const links = getPageLinks(currentUrl, body)
    const promises = links.map(link => spiderTask(link, nesting-1, queue))

    return Promise.all(promises)
}

const spidering = new Set()
const spiderTask = (url, nesting, queue) => {
    if(spidering.has(url)) {
        return Promise.resolve()
    }
    spidering.add(url)

    const filename = urlToFilename(url)
    const pathFilename = './html-downloaded/' + filename
    
    return queue.runTask(() => {
        return fsPromises.readFile(pathFilename, 'utf-8')
            .catch(err => {
                if(err.code !== 'ENOENT') {
                    throw err
                }
    
                return downloadFromUrl(url, pathFilename)
            })
            .then(content => spiderLinks(url, content, nesting, queue))
    })
}


