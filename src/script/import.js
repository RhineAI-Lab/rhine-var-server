const Y = require('yjs')
const fs = require('fs')
const path = require('path')
const { LeveldbPersistence } = require('y-leveldb')

const persistenceDir = process.env.YPERSISTENCE || './database'
const importDir = process.env.IMPORT_DIR || './import'

const ldb = new LeveldbPersistence(persistenceDir)

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath)
  files.forEach((file) => {
    const filePath = path.join(dirPath, file)
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles)
    } else {
      arrayOfFiles.push(filePath)
    }
  })
  return arrayOfFiles
}


function safeSet(from, key, value) {
  if (!from) {
    console.error('safeSet: from is null')
    return null
  }
  if (from instanceof Y.Map && typeof key === 'string') {
    if (Array.isArray(value)) {
      let array = new Y.Array()
      from.set(key, array)
      for (let i = 0; i < value.length; i++) {
        safeSet(array, i, value[i])
      }
    } else if (typeof value === 'object') {
      let map = new Y.Map()
      from.set(key, map)
      for (const key in value) {
        safeSet(map, key, value[key])
      }
    } else {
      from.set(key, value)
    }
    if (from.doc !== null) {
      return from.get(key)
    } else {
      return null
    }
  } else if (from instanceof Y.Array && typeof key === 'number') {
    if (key >= from.length) {
      for (let i = from.length; i <= key; i++) {
        if (Array.isArray(value)) {
          from.push([new Y.Array()])
        } else if (typeof value === 'object') {
          from.push([new Y.Map()])
        } else {
          from.push([0])
        }
      }
    }
    if (Array.isArray(value)) {
      let array = new Y.Array()
      from.delete(key, 1)
      from.insert(key, [array])
      for (let i = 0; i < value.length; i++) {
        safeSet(array, i, value[i])
      }
    } else if (typeof value === 'object') {
      let map = new Y.Map()
      from.delete(key, 1)
      from.insert(key, [map])
      for (const key in value) {
        safeSet(map, key, value[key])
      }
    } else {
      from.delete(key, 1)
      from.insert(key, [value])
    }
    if (from.doc !== null) {
      return from.get(key)
    } else {
      return null
    }
  }
  return null
}


function safeSetAll(from, value = {}) {
  if (!from) {
    console.error('safeSetAll: from is null')
    return null
  }
  if (from instanceof Y.Array && Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      safeSet(from, i, value[i])
    }
  } else if (from instanceof Y.Map && typeof value === 'object') {
    for (const key in value) {
      safeSet(from, key, value[key])
    }
  } else {
    console.error('safeSetAll: type not match')
  }
  return from
}

async function main() {
  const fileList = getAllFiles(importDir)
  for (const filePath of fileList) {
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const jsonData = JSON.parse(fileContent)

    let docName = path.relative(importDir, filePath)
    docName = docName.replace(/\.[^/.]+$/, '')

    const yDoc = new Y.Doc()
    const map = yDoc.getMap()
    safeSetAll(map, jsonData)

    await ldb.storeUpdate(docName, Y.encodeStateAsUpdate(yDoc))
    console.log(`Document ${docName} imported.`)
  }
}

main()
