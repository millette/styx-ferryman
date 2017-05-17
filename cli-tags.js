#!/usr/bin/env node

'use strict'

// npm
const hyperquest = require('hyperquest')

const u = 'http://localhost:5993/u2/_design/categories/_view/categories?group_level=1'
const ff = (a) => a.value > 3
const mm = (a) => a.key[0]
let str = ''

const ss = (a, b) => {
  const ka = a.value
  const kb = b.value
  if (ka > kb) { return 1 }
  if (ka < kb) { return -1 }
  return 0
}

hyperquest(u)
  .on('data', (chunk) => { str += chunk })
  .on('end', () => {
    const rep = JSON.parse(str)
    const tags = rep.rows
      .sort(ss)
      .reverse()
      .filter(ff)
      .map(mm)
      .sort()
    console.log(JSON.stringify(tags, null, ' '))
  })
