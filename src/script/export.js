const Y = require('yjs')
const fs = require('fs')
const path = require('path')
const { LeveldbPersistence } = require('y-leveldb')

const persistenceDir = process.env.YPERSISTENCE || './database'
const exportDir = process.env.EXPORT_DIR || './export'

const ldb = new LeveldbPersistence(persistenceDir)

async function main() {
  const pathList = await ldb.getAllDocNames()
  for (const docPath of pathList) {
    const ydoc = await ldb.getYDoc(docPath)
    const map = ydoc.getMap()
    const json = JSON.stringify(map.toJSON(), null, 2)
    const filePath = `${exportDir}/${docPath}.json`

    await fs.mkdirSync(path.dirname(filePath), { recursive: true })
    await fs.writeFileSync(filePath, json, { encoding: 'utf8' })
    console.log(`Document ${docPath} exported.`)
  }
}

main()
