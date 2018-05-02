const LndEngine = require('lnd-engine')
const lnd = new LndEngine()

lnd.getInfo().then((res) => {
  console.log(res)
}).catch((err) => {
  console.error(err)
})
