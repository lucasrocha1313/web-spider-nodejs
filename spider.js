import {promises as fsPromises} from 'fs'
import {dirname} from 'path'
import superagent from 'superagent'
import mkdirp from 'mkdirp'
import { urlToFilename, getPageLinks } from './utils.js'
import { TaskQueue } from './TaskQueue.js'

export async function spider(url, nesting, concurrency) {
    return spiderTask(url, nesting, new TaskQueue(concurrency))
}

const downloadFromUrl = async (url, filename) => {
    console.log(`Downloading ${url} into ${filename}`)
    const {text: content} = await superagent.get(url)
    await mkdirp(dirname(filename))
    await fsPromises.writeFile(filename, content)
    console.log(`Downloaded and saved: ${url}`)
    return content    
}

const spiderLinks = async (currentUrl, body, nesting, queue) => {
    if (nesting === 0) {
        return Promise.resolve()
    }

    const links = getPageLinks(currentUrl, body)
    const promises = links.map(link => spiderTask(link, nesting-1, queue))

    return Promise.all(promises)
}

const spidering = new Set()
const spiderTask = async (url, nesting, queue) => {
    if(spidering.has(url)) {
        return
    }
    spidering.add(url)

    const filename = urlToFilename(url)
    const pathFilename = './html-downloaded/' + filename

    const content = await queue.runTask(async () => {
        try {
            return await fsPromises.readFile(pathFilename, 'utf-8')
        } catch (err) {
            if(err.code !== 'ENOENT') {
                throw err
            }

            return downloadFromUrl(url, pathFilename)
        }
    })

    return spiderLinks(url, content, nesting, queue)   
}


