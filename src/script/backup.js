const { exec } = require('child_process')
const path = require('path')

const backupDir = process.env.BACKUP_DIR || './backup'
const backupMode = process.env.BACKUP_MODE || 'COPY'

function getTimestampedDir() {
    const now = new Date()
    const timestamp = now.getFullYear().toString() + '-' +
        ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
        ('0' + now.getDate()).slice(-2) + '_' +
        ('0' + now.getHours()).slice(-2) + '-' +
        ('0' + now.getMinutes()).slice(-2) + '-' +
        ('0' + now.getSeconds()).slice(-2)
    return `${backupDir}/${timestamp}`
}

function runExport() {
    const exportDir = getTimestampedDir()
    console.log(`Starting backup to directory: ${exportDir}`)
    if (backupMode === 'EXPORT') {
        const env = Object.assign({}, process.env, { EXPORT_DIR: exportDir })
        const command = `node src/export.js`
        exec(command, { env: env }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing backup: ${error}`)
                scheduleNextRun()
                return
            }
            console.log(`Backup completed at ${new Date().toLocaleString()}`)
            if (stdout) console.log(stdout)
            if (stderr) console.error(stderr)
            scheduleNextRun()
        })
    } else {
        const command = `cp -r database ${exportDir}`
        exec(command, { env: {} }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing backup: ${error}`)
                scheduleNextRun()
                return
            }
            console.log(`Backup completed at ${new Date().toLocaleString()}`)
            if (stdout) console.log(stdout)
            if (stderr) console.error(stderr)
            scheduleNextRun()
        })
    }
}

function scheduleNextRun() {
    const now = new Date()
    let next = new Date()
    next.setHours(4, 0, 0, 0)
    if (now >= next) {
        next.setDate(next.getDate() + 1)
    }
    const msUntilNextRun = next.getTime() - now.getTime()
    console.log(`Next export scheduled at ${next.toLocaleString()}`)
    setTimeout(runExport, msUntilNextRun)
}

runExport()
