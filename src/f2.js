'use strict'

// npm
const hyperquest = require('hyperquest')
const JSONStream = require('JSONStream')
const miss = require('mississippi')
const tb = require('through-batch')
const parallel = require('parallel-transform')

const nop = (item, cb) => cb(null, item)

module.exports = (u, task, per) => miss.pipe(
  hyperquest(u),
  JSONStream.parse('rows.*'),
  parallel(per || 5, task || nop),
  tb(per || 5)
)

