// probably create a fake order here
// We want to query all orders in the following format
// Orders
//   .where(baseSymbol = baseSymbol)
//   .where(counterSymbol = counterSymbol)
//   .series('SELECT * FROM Orders WHERE orderId = orderId LIMIT 1)
//   .where('status === 'PLACED' OR status === 'FILLING')
//
// The series part of the query needs to follow this pattern
// const firstInstance = orders.map( order => order.orderId ).indexOf(order.orderId) === index
