angular.module('pendura.controllers', [])

.controller('SynchCtrl', function($scope, Operations) {
  if (undefined == $scope.pending) $scope.pending = 'Verde'
  if (undefined == $scope.nick) $scope.nick = 'Alain'
  $scope.$on('NewPendingTransaction', function() {
    $scope.$broadcast('NewPendingTransaction')
  })
})
.controller('DashCtrl', function($scope, Operations) {
  $scope.balance = Operations.balance($scope.pending, $scope.nick)
  $scope.$on('NewPendingTransaction', function() {
    $scope.balance = Operations.balance($scope.pending, $scope.nick)
  })
})
.controller('OpsCtrl', function($scope, Operations) {
  $scope.operations = Operations.mine($scope.pending, $scope.nick)
  $scope.$on('NewPendingTransaction', function() {
    $scope.operations = Operations.mine($scope.pending, $scope.nick)
  })
})
.controller('RegisterCtrl', function($scope, $state, $filter, Operations) {
  $scope.partners = function(){return Operations.partners($scope.pending, $scope.nick)}
  $scope.transaction = {}
  $scope.register = function() {
    var ts = $filter('date')(new Date(), "yyyyMMddHHmmss.sss")
    Operations.transaction($scope.pending, $scope.nick, ts, $scope.transaction)
    $scope.$emit('NewPendingTransaction')
    $scope.transaction = {}
    $state.go('tab.ops')
  }
})
.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    checkFriends: true
  }
})
