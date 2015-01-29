angular.module('pendura.services', [])

.factory('Operations', function() {

  // Some fake testing data
  var operations = {
    'tupi' : [{
      ts: '20150128191225.123',
      from: 'Marcos',
      to: 'Alain',
      amount: 5042
    }],
    'verde' : [{
      ts: '20150125131225.123',
      from: 'Marcos',
      to: 'Alain',
      amount: 1042
    }, {
      ts: '20150123131225.234',
      from: 'Alano',
      to: 'Alain',
      amount: 482
    }, {
      ts: '20150121131225.345',
      from: 'Alain',
      to: 'Neto',
      amount: 1500
    }, {
      ts: '20150113131225.456',
      from: 'Alano',
      to: 'Marcos',
      amount: 848
    }, {
      ts: '20150111131225.567',
      from: 'Marcos',
      to: 'Neto',
      amount: 500
}]}

  var filter = function(elements, checker) {
      var filtered = []
      for (var i = 0; i < elements.length; i++) {
        var element = elements[i]
        if (checker(element)) {
          filtered.push(element)
        }
      }
      return filtered
  }

  var sumup = function(pendops, extractor) {
    pendops.sort(function(opa, oma){return extractor(opa) < extractor(oma)})
    var partners = []
    var value = 0
    var name = ''
    for (var i = 0; i < pendops.length; i++) {
      var operation = pendops[i]
      if (extractor(operation) === name) {
        value += operation.amount
      } else {
        partners.push({name: name, amount: value})
        name = extractor(operation)
        value = operation.amount
      }
    }
    partners.push({name: name, amount: value})
    partners.shift() // remove the first entry whose name === ''
    return partners
  }

  var merge = function(creditors, debitors) {
    var keys = []
    for (var i = 0; i < creditors.length; i++) {
      keys.push(creditors[i].name)
    }
    for (var i = 0; i < debitors.length; i++) {
      keys.push(debitors[i].name)
    }
    keys.sort()
    for (var i = keys.length -1; i > 0; ) {
      if (keys[i] === keys[i -1]) {
        keys.splice(i-1,1)
      } else i--
    }
    var amount = function(partners) {
      return (partners.length > 0) ? partners[0].amount : 0
    }
    var merged = []
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i]
      var credit = filter(creditors, function(element){return element.name === key})
      var debit = filter(debitors, function(element){return element.name === key})
      merged.push({name: key, amount: amount(credit)-amount(debit)})
    }
    return merged
  }

  return {
    all: function() {
      return operations
    },
    balance: function(pending, name) {
      var lname = name.toLowerCase()
      var pendops = operations[pending.toLowerCase()]
      var creditors = sumup(pendops, function(operation){return operation.from})
      var debitors = sumup(pendops, function(operation){return operation.to})
      var leftovers = merge(creditors, debitors)
      var leftover = filter(leftovers, function(partner){return partner.name.toLowerCase() === lname})[0].amount
      var partners = (leftover < 0) ? filter(leftovers, function(partner){return partner.amount > 0}) : filter(leftovers, function(partner){return partner.amount < 0})
      partners.sort(function(pa, ma){return Math.abs(ma.amount)-Math.abs(pa.amount)})
      return { leftover: leftover, participants: partners }
    },
    mine: function(pending, name) {
      var lname = name.toLowerCase()
      var pendops = operations[pending.toLowerCase()]
      var credits = filter(pendops, function(operation){return operation.from.toLowerCase() === lname})
      var debits = filter(pendops, function(operation){return operation.to.toLowerCase() === lname})
      var filtered = credits.concat(debits)
      filtered.sort(function(opa, oma) {return opa.ts < oma.ts})
      return filtered
    },
    transaction: function(pending, name, ops) {
      var lname = name.toLowerCase()
      var pendops = operations[pending.toLowerCase()]
      for (var i = 0; i < ops.length; i++) {
        var operation = ops[i]
        pendops.unshift(operation)
      }
      return pendops
    }
  }
})

.factory('Partners', function() {
  var partners = {
    'tupi': ['Alain','Marcos'],
    'verde': ['Alain','Alano','Marcos','Neto']
  }
  
  var filter = function(elements, checker) {
      var filtered = []
      for (var i = 0; i < elements.length; i++) {
        var element = elements[i]
        if (checker(element)) {
          filtered.push(element)
        }
      }
      return filtered
  }

  var operation = function(ts, creditor, amount, debitor) {
    return (amount>0) ? {ts: ts, from: creditor, amount: amount, to: debitor} : {ts: ts, from: debitor, amount: amount, to: creditor}
  }

  return {
    all: function(pending, name) {
      var lname = name.toLowerCase()
      return filter(partners[pending.toLowerCase()], function(partner){return partner.toLowerCase() !== lname})
    },
    register: function(pending, name, ts, transaction) {
      var operations = []
      var sum = 0
      for(property in transaction) {
        if (transaction.hasOwnProperty(property)){
          var amount = 1* (100 * transaction[property]).toFixed(0)
          operations.push(operation(ts, pending, amount, property))
          sum += amount
        }
      }
      operations.push(operation(ts, name, sum, pending)) 
      return operations
    }
  }
})
