'use strict'

// npm
const utils = require('.')
const miss = require('mississippi')
const FeedParser = require('feedparser')
const _ = require('lodash')
const hyperquest = require('hyperquest')

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

const out = miss.through.obj((docs, enc, cb) => {
  // console.log('DOCS:', docs[0].length)
  docs = docs[0].filter(Boolean)
  cb(null, JSON.stringify({ docs }))
})

const doX = (doc, cb, x) => {
  // console.log('DOC', doc)
  // console.log('X', x)
  if (!x) {
    return cb(null, {
      feed: {
        error: 'no-doc'
      }
    })
  }

  x._id = doc._id
  x._rev = doc._rev

  if (doc.history && doc.history.length) {
    x.history = doc.history.slice()
  } else {
    x.history = []
  }

  delete doc.history
  x.history.push(doc)

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

  const docs = []

  fromString(x.content).pipe(fp)
    .on('error', (err) => {
      // console.error('FEED ERROR', err)
      x.feed.error = err.toString() || true
      delete x.content
      cb(null, x)
    })
    .on('meta', (meta) => {
      x.feed.meta = _.pickBy(meta, picker)
      // delete x.content
      // cb(null, x)
    })
    .on('readable', function() {
      let item
      while (item = this.read()) {
        item._id = ['item', item.guid || item.link].join(':')
        item.source = x.requestedUrl
        item.fetchedAt = new Date().toISOString()
        docs.push(_.pickBy(item, picker))
        // console.log('FEED ITEM', item)
      }
    })
    .on('end', () => {
      delete x.content
      if (docs.length) {
        const hr = hyperquest.post('http://localhost:5993/u2/_bulk_docs', {
          headers: {
            accept: 'application/json',
            'content-type': 'application/json'
          }
        })
        hr.end(JSON.stringify({ docs }))
      }
      cb(null, x)
    })
}

const yo = (item, cb) => {
  // console.error('yo', item)
  const options = {
  }

  if (item.doc && item.doc.res && item.doc.res.headers) {
    if (item.doc.res.headers.etag) {
      options.etag = item.doc.res.headers.etag
    } else if (item.doc.res.headers['last-modified']) {
      options.date = item.doc.res.headers['last-modified']
    }
  }

  return utils.f1.getUrl(item.doc._id, options)
    .then(doX.bind(null, item.doc, cb))
    .catch(cb)
}

/*
const yo2 = (item, cb) => {
  if (item.doc) { return cb(null, false) }
  return utils.f1.getUrl(item.value._id)
    .then(doX.bind(null, cb))
    .catch(cb)
}

const yo3 = (item, cb) => {
  console.log('ITEM', item.doc.res.headers)
  cb(null, item)
}
*/

miss.pipe(
  utils.f2(
    'http://localhost:5993/u2/_design/FeedsDates/_view/feeds?reduce=false&include_docs=true',
    yo,
    15
  ),
  // out,
  utils.bulkPost,
  process.stdout
)
