'use strict'

// 78 MiB
// multiple columns
// GlobalRank,TldRank,Domain,TLD,RefSubNets,RefIPs,IDN_Domain,IDN_TLD,PrevGlobalRank,PrevTldRank,PrevRefSubNets,PrevRefIPs
// http://downloads.majestic.com/majestic_million.csv

// core
// const fs = require('fs')

// npm
const pMapSeries = require('p-map-series')
const concat = require('concat-stream')
const Iconv = require('iconv').Iconv
const hyperquest = require('hyperquest')
const _ = require('lodash')

const charsetRe = /; *charset=(.+)$/
// const data = require('./top-5k-v8').map(norm)

// const data = require('./qc-sites')

let timingOut = 30

const getUrl = (u) => new Promise((resolve, reject) => {
  const now = Date.now()
  // let cncl
  const timeout = timingOut * 1000
  const ret = {
    requestedUrl: u,
    timing: [['called', new Date(now).toISOString()]]
  }
  const timing = (label) => ret.timing.push([label, Date.now() - now])
  const onResponse = function (res) {
    timing('response')
    // if (cncl) { clearTimeout(cncl) }
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
      // console.error(u, res.headers['content-type'], cs[1], cs[1].toLowerCase().replace(/["'-]/g, ''), e)
    }
    s.pipe(concat((data) => { if (data.length) { ret.content = data.toString() } }))
  }

  const done = (err) => {
    // if (cncl) { clearTimeout(cncl) }
    if (err) {
      timing(typeof err === 'string' ? err : 'error')
      ret.error = err
    } else {
      timing('end')
    }
    resolve(ret)
  }

  // cncl = setTimeout(done.bind(null, 'timeout'), timeout)
  hyperquest(u, {
    timeout,
    headers: {
      // also handle gzip!
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:52.0; burlesk) Gecko/20100101 Firefox/52.0'
    }
  })
    .on('error', done)
    .on('request', timing.bind(null, 'request'))
    .on('response', onResponse)
    .on('end', done)
})

const doBatch = (d) => {
  console.error('Doing batch with', d.length)
  const n = Date.now()
  const sets = []
  const per = _.clamp(Math.round(d.length / 40), 6, 40)
  const d2 = d.slice()
  let s1

  while (d2.length) {
    s1 = _.sampleSize(d2, per)
    console.error('set of', s1.length)
    _.pullAll(d2, s1)
    sets.push(s1)
  }

  const mapper = (dd) => Promise.all(dd.map(getUrl))
    .then((x) => {
      const el = Date.now() - n
      console.error(el / 60000)
      // console.log(JSON.stringify(x, null, '  '))
      return x
    })
    .catch(console.error)

  return pMapSeries(sets, mapper)
    .then(result => {
      console.error('result.length', result.length)
      const fl = _.flatten(result)
      console.error('fl.length', fl.length)
      return fl
    })
    .catch(console.error)
}

/*
doBatch(data)
  .then((x) => {
    console.error('x.length', x.length)
    // console.log(JSON.stringify(x, null, '  '))
    const toed = x.filter((i) => i.error === 'timeout').map((i) => i.requestedUrl)
    console.error('toed', toed.length)
    timingOut *= 1.4
    return Promise.all([x, doBatch(toed)])
  })
  .then((z) => {
    const fl = _.flatten(z)
    console.error('fl2.length', z.length, fl.length)

    const toed = z[1].filter((i) => i.error === 'timeout').map((i) => i.requestedUrl)
    console.error('toed2', toed.length)

    // console.log(JSON.stringify(fl, null, '  '))
    timingOut *= 1.4
    // return doBatch(toed)
    return Promise.all([fl, doBatch(toed)])
  })
  .then((z) => {
    const fl = _.flatten(z)
    console.error('fl3.length', fl.length)
    const toed = z[1].filter((i) => i.error === 'timeout').map((i) => i.requestedUrl)
    console.error('toed3', toed.length)
    console.log(JSON.stringify(fl, null, '  '))
    process.exit(0)
  })
  .catch(console.error)
*/
module.exports = { getUrl, doBatch }
