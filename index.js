'use strict'

// 78 MiB
// multiple columns
// GlobalRank,TldRank,Domain,TLD,RefSubNets,RefIPs,IDN_Domain,IDN_TLD,PrevGlobalRank,PrevTldRank,PrevRefSubNets,PrevRefIPs
// http://downloads.majestic.com/majestic_million.csv

// core
// const fs = require('fs')

// npm
const pMapSeries = require('p-map-series');
const concat = require('concat-stream')
const Iconv = require('iconv').Iconv
const hyperquest = require('hyperquest')
const norm = require('normalize-url')
const _ = require('lodash')

const charsetRe = /; *charset=(.+)$/

const data = require('./top-5k').map(norm)

const getUrl = (u) => new Promise((resolve, reject) => {
  const now = Date.now()
  let cncl
  const timeout = 5000
  const ret = {
    requestedUrl: u,
    timing: [['called', new Date(now).toISOString()]]
  }
  const timing = (label) => ret.timing.push([label, Date.now() - now])
  const onResponse = function (res) {
    timing('response')
    ret.res = _.pick(res, ['statusCode', 'statusMessage', 'headers'])
    const cs = res.headers && res.headers['content-type'] && res.headers['content-type'].match(charsetRe)
    let s = this
    try {
      if (cs && cs[1] && cs[1].toLowerCase().replace(/["'-]/g, '') !== 'utf8') {
        const cs1 = cs[1].replace(/["']/g, '')
        const ic = new Iconv(cs1, 'UTF-8//TRANSLIT//IGNORE')
        s = this.pipe(ic)
        ret.encodingUsed = cs1
      }
    } catch (e) {
      console.error(u, res.headers['content-type'], cs[1], cs[1].toLowerCase().replace(/["'-]/g, ''), e)
    }
    s.pipe(concat((data) => { if (data.length) { ret.content = data.toString() } }))
  }

  const done = (h, err) => {
    if (cncl) { clearTimeout(cncl) }

    timing(err ? 'error' : 'end')
    if (err) {
      h.emit('end')
      ret.error = err
    }
    resolve(ret)
  }

  const cancel = (h) => {
    console.error('cancelled', u)
    // h.emit('end')
    const err = new Error('cancelled')
    done(h, err)
  }

  const hr = hyperquest(u, { timeout })
  hr
    .on('error', done.bind(null, hr))
    .on('request', timing.bind(null, 'request'))
    .on('response', onResponse)
    .on('end', done.bind(null, hr))
    .resume()

  cncl = setTimeout(cancel.bind(null, hr), timeout)
})

const doBatch = (d) => {
  const n = Date.now()

  const sets = []
  const per = 40
  let r
  for (r = 0; r < 25; ++r) {
    sets.push(d.slice(r * per, (1 + r) * per))
  }

  const mapper = (dd) => Promise.all(dd.map(getUrl))
    .then((x) => {
      const el = Date.now() - n
      const errs = x.filter((a) => a.error).map((a) => a.error.message)
      console.log(errs.join('\n'), errs.length)
      console.log(el / 60000)
      console.log(JSON.stringify(x, null, '  '))
      return x
    })
    .catch(console.error)

  pMapSeries(sets, mapper)
    .then(result => {
      console.log('result.length', result.length)
      const fl = _.flatten(result)
      console.log('fl.length', fl.length)
    })
}

doBatch(data)
