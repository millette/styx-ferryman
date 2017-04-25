'use strict'

// 78 MiB
// multiple columns
// GlobalRank,TldRank,Domain,TLD,RefSubNets,RefIPs,IDN_Domain,IDN_TLD,PrevGlobalRank,PrevTldRank,PrevRefSubNets,PrevRefIPs
// http://downloads.majestic.com/majestic_million.csv

// core
const fs = require('fs')

// npm
const BufferList = require('bl')
const hyperquest = require('hyperquest')
const norm = require('normalize-url')
// const _ = require('lodash')

const data = require('./top-5k').slice(1700, 2700).map(norm)

let pending = 0

const getUrl = (u) => new Promise((resolve, reject) => {
  const bl = new BufferList()
  let now
  const r = hyperquest(u, { timeout: 30000 })
  r.on('data', (buf) => {
    bl.append(buf)
  })
  r.on('request', (req) => {
    pending += 1
    now = Date.now()
    const el = Date.now() - now
    console.log('req', pending, el, u)
  })

  r.on('response', (res) => {
    now = Date.now()
    const el = Date.now() - now
    console.log('res', pending, el, u, res.url, res.statusCode)
  })

  r.on('error', (err) => {
    const el = Date.now() - now
    console.log('err', pending, el, u, err.toString())
    pending -= 1
    resolve({ url: u, error: err })
  })

  r.on('end', () => {
    const el = Date.now() - now
    const str = bl.toString()
    console.log('end', pending, el, str.length, u)
    pending -= 1
    resolve({ url: u, cnt: str })
  })
})

const n = Date.now()
Promise.all(data.map(getUrl))
  .then((x) => {
    const el = Date.now() - n
    const errs = x.filter((a) => a.error).map((a) => a.error.message)
    console.log(errs.join('\n'), errs.length)
    console.log(el / 60000)
  })
  .catch((err) => {
    console.error(err)
  })
