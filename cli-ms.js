'use strict'

// npm
const utils = require('.')
const metascraper = require('metascraper')
// const hyperquest = require('hyperquest')
// const JSONStream = require('JSONStream')
const miss = require('mississippi')
const _ = require('lodash')

// const pj = JSONStream.parse('rows.*')

const syndication = ($) => {
  const feeds = []
  const extract = function () {
    const f = $(this).attr('href')
    if (f) { feeds.push(f) }
  }
  $('link[type*=rss]').each(extract)
  $('link[type*=atom]').each(extract)
  return feeds.length && feeds
}

const rules = Object.assign({ syndication }, metascraper.RULES)

/*
const ms = miss.through.obj((chunk, enc, cb) => {
  metascraper.scrapeHtml(chunk.value, rules)
    .then((x) => cb(null, Object.assign(chunk.doc, { metascraper: _.pickBy(x, Boolean) })))
    .catch((error) => cb(null, Object.assign(chunk.doc, { metascraper: { error } })))
})

const out = miss.through.obj((chunk, enc, cb) => cb(null, JSON.stringify(chunk) + '\n'))

miss.pipe(
  hyperquest(u),
  pj,
  ms,
  out,
  process.stdout
)
*/

/*
const asDocs = miss.through.obj((docs, enc, cb) => {
  // const g = JSON.stringify({ docs })
  // console.log('asDocs...', g)
  // console.log('docs[0]', docs[0])
  // cb(null, { docs })
  // docs = docs.filter(Boolean)

  // console.log('docs.length', docs.length)
  // cb(null, JSON.stringify({ docs }))

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
const doX = (cb, x) => {
  x._id = x.requestedUrl
  cb(null, x)
}

const yo2 = (item, cb) => {
  if (item.doc) { return cb(null, false) }
  const so = url.parse(item.value._id)
  if (so.protocol !== 'http:' && so.protocol !== 'https:') { return cb(null, false) }
  utils.f1.getUrl(item.value._id)
    .then(doX.bind(null, cb))
    .catch(cb)
}
*/

const yo = (chunk, cb) => metascraper.scrapeHtml(chunk.value, rules)
  .then((x) => cb(null, Object.assign(chunk.doc, { metascraper: _.pickBy(x, Boolean) })))
  .catch((error) => cb(null, Object.assign(chunk.doc, { metascraper: { error } })))

/*
const ms = miss.through.obj((chunk, enc, cb) => {
  metascraper.scrapeHtml(chunk.value, rules)
    .then((x) => cb(null, Object.assign(chunk.doc, { metascraper: _.pickBy(x, Boolean) })))
    .catch((error) => cb(null, Object.assign(chunk.doc, { metascraper: { error } })))
})
*/

miss.pipe(
  utils.f2(
    'http://localhost:5993/u2/_design/content/_view/content?reduce=false&include_docs=true',
    yo,
    20
  ),
  utils.bulkPost,
  // asDocs,
  process.stdout
)
