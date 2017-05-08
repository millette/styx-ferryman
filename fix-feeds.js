'use strict'

// npm
const utils = require('.')
const miss = require('mississippi')

const u = 'http://localhost:5993/u2/_design/feedsDocRel/_view/feeds?reduce=false&include_docs=true'

const yo = (chunk, cb) => {
  if (chunk.value.length && chunk.doc.metascraper.syndication.length === chunk.value.length) {
    chunk.doc.metascraper.syndication = chunk.value
    cb(null, chunk.doc)
  } else {
    cb(null, false)
  }
}

miss.pipe(
  utils.f2(
    u,
    yo,
    8
  ),
  utils.bulkPost,
  process.stdout
)
