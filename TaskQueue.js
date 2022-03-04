export class TaskQueue {
    constructor(concurrency) {
        this.queue = []
        this.consumerQueue = []

        for(let i = 0; i < concurrency; i++) {
            this.consumer()
        }
    }

    async consumer() {
        while(true) {
            try {
                const task = await this.getNextTask()
                await task()
            } catch (err) {
                console.error(err)
            }
        }
    }

    async getNextTask() {
        return new Promise((resolve) => {
            if(this.queue.length !== 0) {
                return resolve(this.queue.shift())
            }

            this.consumerQueue.push(resolve)
        })
    }

    runTask(task) {
        return new Promise((resolve, reject) => {
            const taskWrapper = () => {
                const taskPromise = task()
                taskPromise.then(resolve, reject)
                return taskPromise
            }

            if(this.consumerQueue.length !== 0) {
                const consumer = this.consumerQueue.shift()
                consumer(taskWrapper)
            } else {
                this.queue.push(taskWrapper)
            }
        })
    }
}