angular.module('pendura.controllers', [])

.controller('SynchCtrl', function($scope, Operations) {
  if (undefined === $scope.active) {
    $scope.active = { uuid: 'CAFE-BABE-0123456789', name: 'Verde', nick: 'Alain' }
  }
  $scope.$on('NewPendingTransaction', function() {
    $scope.$broadcast('NewPendingTransaction')
  })
})
.controller('DashCtrl', function($scope, Operations) {
  $scope.balance = Operations.balance($scope.active)
  $scope.$on('NewPendingTransaction', function() {
    $scope.balance = Operations.balance($scope.active)
  })
})
.controller('OpsCtrl', function($scope, Operations) {
  $scope.operations = Operations.mine($scope.active)
  $scope.$on('NewPendingTransaction', function() {
    $scope.operations = Operations.mine($scope.active)
  })
})
.controller('RegisterCtrl', function($scope, $state, $filter, Operations) {
  $scope.partners = Operations.partners($scope.active)
  $scope.transaction = {}
  $scope.register = function() {
    var ts = $filter('date')(new Date(), "yyyy-MM-ddTHH:mm:ss.sss")
    Operations.transaction($scope.active, ts, $scope.transaction)
    $scope.$emit('NewPendingTransaction')
    $scope.transaction = {}
    $state.go('tab.ops')
  }
})
.controller('AccountCtrl', function($scope, $state, Operations) {
  $scope.settings = {
    checkFriends: true
  }
  $scope.pendings = Operations.pendings($scope.active)
  $scope.activate = function(){
    Operations.activate($scope.active, $scope.pendings)
    $scope.$apply()
    $scope.$emit('NewPendingTransaction')
    $state.go('tab.dash')
  }
  $scope.create = function(){Operations.create($scope.active, $scope.pendings)}
})
