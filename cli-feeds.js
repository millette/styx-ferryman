#!/usr/bin/env node

'use strict'

// npm
const utils = require('.')
const miss = require('mississippi')
const FeedParser = require('feedparser')
const _ = require('lodash')

const fromString = (string) => miss.from((size, next) => {
  // if there's no more content
  // left in the string, close the stream.
  if (!string.length) { return next(null, null) }

  // Pull in a new chunk of text,
  // removing it from the string.
  const chunk = string.slice(0, size)
  string = string.slice(size)

  // Emit "chunk" from the stream.
  next(null, chunk)
})

/*
const out = miss.through.obj((docs, enc, cb) => {
  docs = docs.filter(Boolean)
  cb(null, JSON.stringify({ docs }))
})
*/

const doX = (cb, x) => {
  if (!x) {
    return cb(null, {
      feed: {
        error: 'no-doc'
      }
    })
  }

  // console.error('doX', x)
  x._id = x.requestedUrl
  x.feed = { createdAt: new Date().toISOString() }
  if (!x.content) {
    x.feed.error = 'no-content'
    return cb(null, x)
  }

  const fp = new FeedParser({
    feedurl: x.requestedUrl,
    addmeta: false
  })

  const picker = (v, k) => (k === 'xmlUrl' || k === 'pubDate' || !v)
    ? false
    : (typeof v !== 'object' || v.toISOString || Object.keys(v).length)

  fromString(x.content).pipe(fp)
    .on('error', (err) => {
      // console.error('FEED ERROR', err)
      x.feed.error = err.toString() || true
      delete x.content
      cb(null, x)
    })
    .on('meta', (meta) => {
      x.feed.meta = _.pickBy(meta, picker)
      delete x.content
      cb(null, x)
    })
}

const yo = (item, cb) => {
  // console.error('yo', item)
  if (item.doc) { return cb(null, false) }
  return utils.f1.getUrl(item.value._id)
    .then(doX.bind(null, cb))
    .catch(cb)
}

miss.pipe(
  utils.f2(
    'http://localhost:5993/u2/_design/feedsFirst/_view/feeds?reduce=false&include_docs=true',
    yo,
    8
  ),
  // out,
  utils.bulkPost,
  process.stdout
)
