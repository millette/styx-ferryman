'use strict'

// 78 MiB
// multiple columns
// GlobalRank,TldRank,Domain,TLD,RefSubNets,RefIPs,IDN_Domain,IDN_TLD,PrevGlobalRank,PrevTldRank,PrevRefSubNets,PrevRefIPs
// http://downloads.majestic.com/majestic_million.csv

const data = require('./top-1m')

console.log(data.length)

console.log(data[0])

console.log(data[999999])
