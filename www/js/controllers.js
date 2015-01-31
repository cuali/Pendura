angular.module('pendura.controllers', [])

.controller('SynchCtrl', function($scope, Operations) {
  if (undefined == $scope.pending) $scope.pending = { uuid: 'CAFE-BABE-0123456789', name: 'Verde', nick: 'Alain' }
  $scope.$on('NewPendingTransaction', function() {
    $scope.$broadcast('NewPendingTransaction')
  })
})
.controller('DashCtrl', function($scope, Operations) {
  $scope.balance = Operations.balance($scope.pending)
  $scope.$on('NewPendingTransaction', function() {
    $scope.balance = Operations.balance($scope.pending)
  })
})
.controller('OpsCtrl', function($scope, Operations) {
  $scope.operations = Operations.mine($scope.pending)
  $scope.$on('NewPendingTransaction', function() {
    $scope.operations = Operations.mine($scope.pending)
  })
})
.controller('RegisterCtrl', function($scope, $state, $filter, Operations) {
  $scope.partners = Operations.partners($scope.pending)
  $scope.transaction = {}
  $scope.register = function() {
    var ts = $filter('date')(new Date(), "yyyyMMddHHmmss.sss")
    Operations.transaction($scope.pending, ts, $scope.transaction)
    $scope.$emit('NewPendingTransaction')
    $scope.transaction = {}
    $state.go('tab.ops')
  }
})
.controller('AccountCtrl', function($scope, Operations) {
  $scope.settings = {
    checkFriends: true
  }
  $scope.bindings = Operations.pendings($scope.pending)
  $scope.pendings = Operations.pendings($scope.pending)
  $scope.participate = function(){Operations.participate($scope.pending, $scope.bindings)}
})
