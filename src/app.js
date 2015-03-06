'use strict';

var myApp = angular.module('Test', ['chute']);

myApp.controller('MainCtrl', ['$scope', 'Chute.API.Asset', function($scope, Asset) {
  $scope.assets = Asset.query({album: 'aus6kwrg', perPage: 3});
}]);