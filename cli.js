'use strict'

const utils = require('.')
const miss = require('mississippi')
const hyperquest = require('hyperquest')

const doX = (item, cb, x) => {
  x._id = item.id
  x._rev = item.key
  // console.log('X', x)
  cb(null, x)
}

const yo = (item, cb) => utils.f1.getUrl(item.id)
  .then(doX.bind(null, item, cb))
  .catch(cb)

/*
const asDocs = miss.through((docs, enc, cb) => {
  const gg = JSON.parse(docs)
  console.log('asDocs...', docs, gg)
  const g = JSON.stringify({ docs: gg })
  console.log('asDocs...', g)
  // cb(null, { docs })
  cb(null, g)
})
*/

const asDocs = miss.through.obj((docs, enc, cb) => {
  // const g = JSON.stringify({ docs })
  // console.log('asDocs...', g)
  // cb(null, { docs })
  const hr = hyperquest.post('http://localhost:5993/u2/_bulk_docs', {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json'
    }
  })
  // hr.pipe(miss.through((chunk, enc, cb2) => {
  hr.pipe(miss.through((chunk) => {
    // console.log('chunk!')
    cb(null, chunk)
  }))
  hr.end(JSON.stringify({ docs }))
})

/*
const asDocs = miss.through.obj((docs, enc, cb) => {
  const g = JSON.stringify({ docs })
  console.log('asDocs...', g)
  // cb(null, { docs })
  cb(null, g)
})
*/

/*
const toDb = hyperquest.post('http://localhost:5993/u2/_bulk_docs', {
  headers: {
    accept: 'application/json',
    'content-type': 'application/json'
  }
})
*/

/*
const toDb = miss.through.obj((docs, enc, cb) => {
  cb(null, { docs })
})
*/

const out = miss.through.obj((batch, enc, cb) => {
  cb(null, JSON.stringify(batch))
})

miss.pipe(
  utils.f2(
    'http://localhost:5993/u2/_design/timeout/_view/timeout?reduce=false',
    yo,
    8
  ),
  asDocs,
  // out,
  // toDb,
  process.stdout
)
