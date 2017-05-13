'use strict'

// npm
const miss = require('mississippi')
const hyperquest = require('hyperquest')

module.exports = miss.through.obj((docs, enc, cb) => {
  // const g = JSON.stringify({ docs })
  // console.log('asDocs...', g)
  // console.log('docs[0]', docs[0])
  // cb(null, { docs })
  docs = docs.filter(Boolean)

  if (!docs.length) { return cb(null, 'no-docs\n') }
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
