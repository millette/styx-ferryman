'use strict'

// npm
const hyperquest = require('hyperquest')

// const u = 'http://localhost:5993/u2/_design/wtf1/_view/bad?reduce=false'

const u = 'http://localhost:5993/u2/_design/itemSources/_view/items?reduce=false&startkey=[{}]'

let str = ''
hyperquest(u)
  .on('data', (chunk) => {
    str += chunk
  })
  .on('end', () => {
    const docs = JSON.parse(str).rows.map((x) => {
      return {
        _id: x.id,
        _rev: x.value,
        _deleted: true
      }
    })
    const hr = hyperquest
      .post('http://localhost:5993/u2/_bulk_docs', {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json'
        }
      })
    hr.end(JSON.stringify({ docs }))
    hr.pipe(process.stdout)
  })
