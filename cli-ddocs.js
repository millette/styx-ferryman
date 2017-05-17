#!/usr/bin/env node

'use strict'

const hyperquest = require('hyperquest')

const u = 'http://localhost:5993/u2/_all_docs?startkey=%22_design/%22&endkey=%22_design/\\uffff%22&include_docs=true'

let str = ''
hyperquest(u)
  .on('data', (chunk) => { str += chunk })
  .on('end', () => {
    const obj = JSON.parse(str)
    const rows = obj.rows.map((row) => {
      delete row.doc._rev
      delete row.doc.language
      return row.doc
    })
    console.log(JSON.stringify(rows, null, '  '))
  })
