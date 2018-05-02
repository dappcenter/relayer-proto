/**
 * Will provide a unique 32bit number that is in order for every second
 *
 */

let time = process.hrtime()

// TOOD: how can we ensure the sequence is correct for multiple processes?
function sequence () {
  let now = process.hrtime(time)
  time = now
  return now[1]
}

module.exports = sequence
