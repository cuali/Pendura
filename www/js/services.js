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
        return JSON.parse($window.localStorage[key] || '{}')
      }
    }
  }
}])
.factory('Operations', ['$filter', function($filter) {
  // Some fake testing data
  var pendings = {
    'CAFE-BABE-0123456789' : {
      name: 'Verde',
      selfie: {nick:'Alain',tick:3},
      partners: [{nick:'Alano',tick:1},{nick:'Marcos',tick:1},{nick:'Neto',tick:0}],
      operations: [{
          ts: '2015-01-25T13:12:25.123',
          tid: 'Marcos¦1',
          from: 'Verde',
          to: 'Alain',
          amount: 1042
        }, {
          ts: '2015-01-25T13:12:25.123',
          tid: 'Marcos¦1',
          from: 'Verde',
          to: 'Neto',
          amount: 500
        }, {
          ts: '2015-01-25T13:12:25.123',
          tid: 'Marcos¦1',
          from: 'Marcos',
          to: 'Verde',
          amount: 1542
        }, {
          ts: '2015-01-23T13:12:25.234',
          tid: 'Alano¦1',
          from: 'Verde',
          to: 'Alain',
          amount: 482
        }, {
          ts: '2015-01-23T13:12:25.234',
          tid: 'Alano¦1',
          from: 'Verde',
          to: 'Marcos',
          amount: 848
        }, {
          ts: '2015-01-23T13:12:25.234',
          tid: 'Alano¦1',
          from: 'Alano',
          to: 'Verde',
          amount: 1330
        }, {
          ts: '2015-01-21T13:12:25.345',
          tid: 'Alain¦1',
          from: 'Verde',
          to: 'Neto',
          amount: 1200
        }, {
          ts: '2015-01-21T13:12:25.345',
          tid: 'Alain¦1',
          from: 'Verde',
          to: 'Alano',
          amount: 300
        }, {
          ts: '2015-01-21T13:12:25.345',
          tid: 'Alain¦1',
          from: 'Alain',
          to: 'Verde',
          amount: 1500
        }]
    },
    'DEAD-BEEF-9876543210' : {
      name: 'Tupi',
      selfie: {nick:'Alain',tick:0},
      partners: [{nick:'Marcos',tick:1}],
      operations: [{
          ts: '2015-01-28T19:12:25.123',
          tid: 'Marcos¦1',
          from: 'Marcos',
          to: 'Tupi',
          amount: 5042
        }, {
          ts: '2015-01-28T19:12:25.123',
          tid: 'Marcos¦1',
          from: 'Tupi',
          to: 'Alain',
          amount: 5042
        }]
    },
    'FEED-FACE-5647382910' : {
      name: 'Facebook',
      partners: [{nick:'Regina',tick:1},{nick:'Flávia',tick:1},{nick:'Isadora',tick:0}],
      operations: []
    }
  }

// don't forget to merge transactions older than 60 days into one summary transaction

  var transform = function(elements, transformer) {
    var transformed = []
    for (var i = 0; i< elements.length; i++) {
      var mapped = transformer(elements[i])
      transformed.push(mapped)
    }
    return transformed
  }

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
    for (var i = 0; i < creditors.length; i++) {
      keys.push(creditors[i].nick)
    }
    for (var i = 0; i < debitors.length; i++) {
      keys.push(debitors[i].nick)
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
      var credits = $filter('filter')(pendops, function(operation){return operation.from.toLowerCase() === lname})
      credits = transform(credits, function(opa){return operation(opa.tid, opa.ts, opa.from, opa.amount, transform($filter('filter')(pendops, function(oma){return (opa.tid === oma.tid) && (oma.from === pending.name)}), function(oma){return oma.to}).join(", "))})
      var debits = $filter('filter')(pendops, function(operation){return operation.to.toLowerCase() === lname})
      debits = transform(debits, function(opa){return operation(opa.tid, opa.ts, transform($filter('filter')(pendops, function(oma){return (opa.tid === oma.tid) && (oma.to === pending.name)}), function(oma){return oma.from}).join(", "), opa.amount, opa.to)})
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
    load: function($q, $cordovaFile) {
      var q = $q.defer()
      var directory = (cordova) ? cordova.file.dataDirectory : "" // http://ngcordova.com/docs/plugins/file/
      $cordovaFile.checkDir(directory, '').then(function(result) {
        $cordovaFile.checkFile(directory, 'pendings.json').then(function(result) {
            // Success!
              q.resolve(result)
        }, function(err) {
          $cordovaFile.createFile(directory, '/pendings.json', true).then(function(result) {
            var blob = new Blob(['{',"'active':{},","'pendings':{}",'}'] , {type: 'text/plain'})
            $cordovaFile.writeFile(directory, 'pendings.json', blob, true).then(function(result) {
              q.resolve(result)
            }, function(err) {
              q.reject({uuid:'FACE-CAFE-FEED-BABE-DEAD-BEEF',nick:'Missing file',name:directory+'/pendings.json'})
            })
          }, function(err) {
            q.reject({uuid:'FACE-CAFE-FEED-BABE-DEAD-BEEF',nick:'Missing file',name:directory+'/pendings.json'})
          })
        })
      }, function(error) {
          console.log(error)
        $cordovaFile.createDir(directory, '', false).then(function(result) {
            // Success! ===> checkFile
              q.resolve(result)
        }, function(err) {
          console.log(err)
          q.reject({uuid:'FACE-CAFE-FEED-BABE-DEAD-BEEF',nick:'Missing directory',name:directory})
        })
      })
      return q.promise
    }
  }
}])
