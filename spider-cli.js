import { spider } from './spider.js'

const url = process.argv[2]
const nesting = Number.parseInt(process.argv[3], 10) || 1

spider(url, nesting, err => {
    if(err) {
        console.error('Something went wrong', {err})
        process.exit(1)
    }

    console.log('Download complete')
})