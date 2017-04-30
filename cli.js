'use strict'

const utils = require('.')
// const parallel = require('parallel-transform')
const miss = require('mississippi')

const yo = (item, cb) => setTimeout((i) => {
  // console.log('.')
  cb(null, i)
}, 100, item)

const out = miss.through.obj((chunk, enc, cb) => {
  cb(null, JSON.stringify(chunk) + '\n')
})

miss.pipe(
  utils.f2(
    'http://localhost:5993/u2/_design/timeout/_view/timeout?reduce=false',
    yo,
    5
  ),
  out,
  process.stdout
)
