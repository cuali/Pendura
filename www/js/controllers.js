angular.module('pendura.controllers', [])

.controller('SynchCtrl', function($scope, $localstorage, Operations) {
  if (undefined === $scope.active) {
    $scope.active = Operations.retrieve($localstorage)
  }
  $scope.$on('RefreshAllScopes', function() {
    Operations.keep($localstorage, $scope.active)
    $scope.$broadcast('RefreshAllScopes')
  })
})
.controller('DashCtrl', function($scope, Operations) {
  $scope.balance = Operations.balance($scope.active)
  $scope.$on('RefreshAllScopes', function() {
    $scope.balance = Operations.balance($scope.active)
  })
})
.controller('OpsCtrl', function($scope, Operations) {
  $scope.operations = Operations.mine($scope.active)
  $scope.$on('RefreshAllScopes', function() {
    $scope.operations = Operations.mine($scope.active)
  })
})
.controller('RegisterCtrl', function($scope, $state, $filter, Operations) {
  $scope.partners = Operations.partners($scope.active)
  $scope.$on('RefreshAllScopes', function() {
    $scope.partners = Operations.partners($scope.active)
  })
  $scope.transaction = {}
  $scope.register = function() {
    var ts = $filter('date')(new Date(), "yyyy-MM-ddTHH:mm:ss.sss")
    Operations.transaction($scope.active, ts, $scope.transaction)
    $scope.$emit('RefreshAllScopes')
    $scope.transaction = {}
    $state.go('tab.ops')
  }
})
.controller('AccountCtrl', function($scope, $state, Operations, uuid4) {
  $scope.uuid = $scope.active.uuid
  $scope.pendings = Operations.pendings($scope.active)
  $scope.activate = function(uuid){
    if (Operations.activate($scope.active, uuid, $scope.pendings)) {
      $scope.$apply()
      $scope.$emit('RefreshAllScopes')
      $state.go('tab.dash')
    }
    $scope.uuid = $scope.active.uuid
    $scope.pendings = Operations.pendings($scope.active)
  }
  $scope.future = { name: '', nick: '', join: false }
  $scope.create = function(pending){
    var uuid = uuid4.generate()
    pending.uuid = uuid
    if (Operations.create(pending)) {
      $scope.activate(uuid)
      $scope.future = { name: '', nick: '', join: false }
    } else {
      $scope.uuid = $scope.active.uuid
      $scope.pendings = Operations.pendings($scope.active)
    }
  }
})
