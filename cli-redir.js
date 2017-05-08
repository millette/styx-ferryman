'use strict'

// core
const url = require('url')

// npm
const utils = require('.')
const miss = require('mississippi')
// const hyperquest = require('hyperquest')

/*
const doX = (item, cb, x) => {
  console.log('ITEM', item)
  console.log('X', x)
  x._id = item.id
  x._rev = item.key
  // console.log('X', x)
  cb(null, x)
}
*/

const doX = (cb, x) => {
  x._id = x.requestedUrl
  cb(null, x)
}

const yo = (item, cb) => {
  if (item.doc) { return cb(null, false) }
  const so = url.parse(item.value._id)
  if (so.protocol !== 'http:' && so.protocol !== 'https:') { return cb(null, false) }
  utils.f1.getUrl(item.value._id)
    .then(doX.bind(null, cb))
    .catch(cb)
}

/*
const yo = (item, cb) => utils.f1.getUrl(item.id)
  .then(doX.bind(null, item, cb))
  .catch(cb)
*/

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

/*
const asDocs = miss.through.obj((docs, enc, cb) => {
  // const g = JSON.stringify({ docs })
  // console.log('asDocs...', g)
  // console.log('docs[0]', docs[0])
  // cb(null, { docs })
  docs = docs.filter(Boolean)
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
*/

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

/*
const out = miss.through.obj((batch, enc, cb) => {
  cb(null, JSON.stringify(batch))
})
*/

miss.pipe(
  utils.f2(
    'http://localhost:5993/u2/_design/redirIds/_view/redir?reduce=false&include_docs=true',
    yo,
    8
  ),
  utils.bulkPost,
  // asDocs,
  process.stdout
)
