#!/usr/bin/env node

'use strict'

// npm
require('dotenv-safe').load()
const hyperquest = require('hyperquest')

const u = 'http://localhost:5993/_replicate'

const headers = {
  accept: 'application/json',
  'content-type': 'application/json'
}

const hr = hyperquest.post(u, { headers })

hr.end(JSON.stringify({
  source: 'u2',
  target: `https://${process.env.Key}:${process.env.Password}@millette.cloudant.com/u2`
}))

hr.pipe(process.stdout)
