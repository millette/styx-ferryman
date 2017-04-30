'use strict'

// npm
const hyperquest = require('hyperquest')
const JSONStream = require('JSONStream')
const miss = require('mississippi')
const tb = require('through-batch')
const parallel = require('parallel-transform')

/*
const yo = (item, cb) => setTimeout((i) => {
  // console.log('.')
  cb(null, i)
}, 100, item)

const out = miss.through.obj((chunk, enc, cb) => {
  cb(null, JSON.stringify(chunk) + '\n')
})
*/

const work = (u, task, per) => miss.pipe(
  hyperquest(u),
  JSONStream.parse('rows.*'),
  parallel(per || 5, task),
  tb(per || 5)
)

/*
miss.pipe(
  work(
    'http://localhost:5993/u2/_design/timeout/_view/timeout?reduce=false',
    yo,
    5
  ),
  out,
  process.stdout
)
*/

module.exports = work
