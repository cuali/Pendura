angular.module('pendura.services', [])
.factory('$localstorage', ['$window', function($window) {
  return {
    set: function(key, value) {
      if (typeof value == 'string' || value instanceof String) {
        $window.localStorage[key] = value
      } else {
        $window.localStorage[key] = JSON.stringify(value)
      }
    },
    get: function(key, defaultValue) {
      if (arguments.length > 1 && (typeof defaultValue == 'string' || defaultValue instanceof String)) {
        return $window.localStorage[key] || defaultValue
      } else {
        var value = $window.localStorage[key]
        if (arguments.length > 1 && undefined == value) {
          return defaultValue
        } else {
          return JSON.parse(value || '{}')
        }
      }
    }
  }
}])
.factory('Operations', ['$filter', function($filter) {
  var pendings = {}

  // Some fake testing data
  var fakedata = {
    'FEED-BABE-CAFE-FACE-DEAD-BEEF' : {
      name: 'Pendura',
      //selfie: {nick:'Alain',tick:0},
      partners: [{nick:'Regina',tick:1},{nick:'Amnésia',tick:0}],
      operations: [{
        ts: '2015-01-28T19:12:25.123',
        tid: 'Regina¦1',
        from: 'Regina',
        to: 'Pendura',
        amount: 1234
      }, {
        ts: '2015-01-28T19:12:25.123',
        tid: 'Regina¦1',
        from: 'Pendura',
        to: 'Amnésia',
        amount: 1234
      }]
    }
  }

// don't forget to merge transactions older than 40 days into one summary transaction

  var sumup = function(pendops, extractor) {
    pendops.sort(function(opa, oma){return extractor(opa) < extractor(oma)})
    var partners = []
    var value = 0
    var nick = ''
    for (var i = 0; i < pendops.length; i++) {
      var operation = pendops[i]
      if (extractor(operation) === nick) {
        value += operation.amount
      } else {
        partners.push({nick: nick, amount: value})
        nick = extractor(operation)
        value = operation.amount
      }
    }
    partners.push({nick: nick, amount: value})
    partners.shift() // remove the first entry whose nick === ''
    return partners
  }

  var merge = function(creditors, debitors) {
    var keys = []
    angular.forEach(creditors, function(creditor, index) {this.push(creditor.nick)}, keys)
    angular.forEach(debitors, function(debitor, index) {this.push(debitor.nick)}, keys)
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
      var credit = $filter('filter')(creditors, function(element){return element.nick === key})
      var debit = $filter('filter')(debitors, function(element){return element.nick === key})
      merged.push({nick: key, amount: amount(credit)-amount(debit)})
    }
    return merged
  }

  var operation = function(tid, ts, creditor, amount, debitor) {
    return (amount>0) ? {ts: ts, tid: tid, from: creditor, amount: amount, to: debitor} : {ts: ts, tid: tid, from: debitor, amount: -amount, to: creditor}
  }

  return {
    balance: function(pending) {
      var lname = pending.nick.toLowerCase()
      var pendops = pendings[pending.uuid].operations
      var creditors = sumup(pendops, function(operation){return operation.from})
      var debitors = sumup(pendops, function(operation){return operation.to})
      var leftovers = merge(creditors, debitors)
      var leftops = $filter('filter')(leftovers, function(partner){return partner.nick.toLowerCase() === lname})
      var leftover = (leftops.length) ? leftops[0].amount : 0
      var partners = (leftover === 0) ? [] : (leftover < 0) ? $filter('filter')(leftovers, function(partner){return partner.amount > 0}) : $filter('filter')(leftovers, function(partner){return partner.amount < 0})
      partners.sort(function(pa, ma){return Math.abs(ma.amount)-Math.abs(pa.amount)})
      return { leftover: leftover, participants: partners }
    },
    mine: function(pending) {
      var lname = pending.nick.toLowerCase()
      var pendops = pendings[pending.uuid].operations
      var credops = $filter('filter')(pendops, function(operation){return operation.from.toLowerCase() === lname})
      var debops = $filter('filter')(pendops, function(operation){return operation.to.toLowerCase() === lname})
      var credits = []
      angular.forEach(credops, function(opa){var to = []; angular.forEach(pendops, function(oma){if ((opa.tid === oma.tid) && (oma.from === pending.name)) this.push(oma.to)}, to); this.push(operation(opa.tid, opa.ts, opa.from, opa.amount, to.join(", ")))}, credits)
      var debits = []
      angular.forEach(debops, function(opa){var from = []; angular.forEach(pendops, function(oma){if ((opa.tid === oma.tid) && (oma.to === pending.name)) this.push(oma.from)}, from); this.push(operation(opa.tid, opa.ts, from.join(", "), opa.amount, opa.to))}, debits)
      var filtered = credits.concat(debits)
      filtered.sort(function(opa, oma) {return opa.ts < oma.ts})
      return filtered
    },
    activate: function(active, uuid, nicks) {
      var pending = pendings[uuid]
      if (undefined === pending.selfie) {
        var nick = $filter('filter')(nicks, function(nick){return nick.uuid === uuid})[0].nick
        var lname = nick.toLowerCase()
        var existing = $filter('filter')(pending.partners, function(partner){return partner.nick.toLowerCase() === lname})
        if (!nick || existing.length || lname === pending.name.toLowerCase()) {
          return false// invalid nick
        }
        pending.selfie = {nick: nick, tick: 0}
      }
      active.nick = pending.selfie.nick
      active.uuid = uuid
      active.name = pending.name
      return true
    },
    create: function(pending) {
      var existing = pendings[pending.uuid]
      if (existing || "" == pending.name || "" == pending.nick || pending.name.toLowerCase() == pending.nick.toLowerCase()) {
        return false
      }
      pendings[pending.uuid] = {name: pending.name, selfie: {nick: pending.nick, tick: 0}, partners: [], operations: []}
      return true
    },
    partners: function(pending) {
      return pendings[pending.uuid].partners
    },
    pendings: function(pending) {
      var filtered = []
      angular.forEach(pendings, function(pending, uuid) {
        var joined = (undefined !== pending.selfie)
        var nick = ''
        var tip = ''
        if (joined) {
          nick = pending.selfie.nick
        } else {
          var names = []
          angular.forEach(pending.partners, function(partner){return this.push(partner.nick)}, names)
          names.push(pending.name)
          tip = "≠ " + names.join(", ")
        }
        this.push({uuid: uuid, name: pending.name, join: joined, nick: nick, tip: tip})
      }, filtered)
      return filtered
    },
    transaction: function(pending, ts, transaction) {
      var pendops = pendings[pending.uuid].operations
      var selfie = pendings[pending.uuid].selfie
      var tid = selfie.nick+'¦'+(++selfie.tick)
      var ops = []
      var sum = 0
      angular.forEach(transaction, function(value, property) {
        var amount = 1* (100 * value).toFixed(0)
        this.push(operation(tid, ts, pending.name, amount, property))
        sum += amount
      }, ops)
      ops.push(operation(tid, ts, selfie.nick, sum, pending.name))
      angular.forEach(ops, function(op, index) {this.unshift(op)}, pendops)
      return pendops.length
    },
    retrieve: function($localstorage) {
      pendings = $localstorage.get('Pendura.pendings', fakedata)
      return $localstorage.get('Pendura.active', { uuid: 'FEED-BABE-CAFE-FACE-DEAD-BEEF', name: 'Pendura', nick: 'você' })
    },
    keep: function($localstorage, pending) {
      $localstorage.set('Pendura.active', pending)
      $localstorage.set('Pendura.pendings', pendings)
    }
  }
}])
