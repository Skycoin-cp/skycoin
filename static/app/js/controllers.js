'use strict';

/* Controllers */

angular.module('skycoin.controllers', [])

.controller('mainCtrl', ['$scope','$http', '$modal', '$log', '$timeout',
  function($scope,$http,$modal,$log,$timeout) {
  	$scope.addresses = [];


  	$scope.getProgress = function(){
      $http.get('/blockchain/progress').success(function(response){
        $scope.progress = (parseInt(response.current,10)+1) / parseInt(response.Highest,10) * 100;

      });
	 }

	$scope.refreshBalances = function() {
	    $scope.loadWallets();
	    $timeout($scope.refreshBalances, 15000);
    }

	 $scope.getProgress();
	 $timeout($scope.refreshBalances, 15000);





  	$scope.loadWallets = function(){
      $http.post('/wallet').success(function(response){
        console.dir(response);
        //$scope.loadedWallet = response;
        for(var i=0;i<response.entries.length;i++){
        	if(!$scope.addresses[i]) $scope.addresses[i] = {};
        	$scope.addresses[i].address = response.entries[i].address;
        }
        for(var i=0;i<response.entries.length;i++){
        	$scope.checkBalance(i,response.entries[i].address);
        }
      });
	 }

	 //console.log('local storage wallet is ' + localStorage.loadedWallet)
	 //$scope.loadWallet(localStorage.loadedWallet);
	 $scope.loadWallets();

	 $scope.saveWallet = function(){
	  var data = {Addresses:$scope.addresses};
      $http.post('/wallet/save', JSON.stringify(data)).success(function(response){
        console.dir(response);
        $scope.loadedWalletName = response;
        localStorage.loadedWallet = response.replace(/"/g, "");
      });
	 }

	 $scope.newAddress = function(){
	  	$http.get('/wallet/address/create').success(function(response) {
	      console.dir(response);
	      $scope.addresses.push(response.address);
	      //$scope.addresses.push(response.replace(/"/g, ""));
	      $scope.saveWallet();
	    });
	 }

	 $scope.sendDisable = false;
	 $scope.readyDisable = true;

	 $scope.ready = function(){
	 	$scope.readyDisable = !$scope.readyDisable;
	 	$scope.sendDisable = !$scope.sendDisable;
	 }

	 $scope.pendingTable = [];
	 $scope.historyTable = [];

	 $scope.spend = function(addr){
	 	$scope.sendDisable = true;
	 	$scope.pendingTable.push(addr);
	 	$scope.historyTable.push(addr);
	 	var xsrf = {dst:addr.address,
	 				coins:addr.amount*1000000,
	 				fee:1,
	 				hours:1}
		$http({
		    method: 'POST',
		    url: '/wallet/spend',
		    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		    transformRequest: function(obj) {
		        var str = [];
		        for(var p in obj)
		        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
		        return str.join("&");
		    },
		    data: xsrf
			}).success(function(response){
		  	 	console.log('wallet spend is ')
		        console.dir(response);
		        $scope.loadWallets();
	      });
	 }

	 $scope.checkBalance = function(wI, address){
	 	var xsrf = {addr:address}
		$http({
		    method: 'POST',
		    url: '/wallet/balance',
		    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		    transformRequest: function(obj) {
		        var str = [];
		        for(var p in obj)
		        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
		        return str.join("&");
		    },
		    data: xsrf
			}).success(function(response){
		        $scope.addresses[wI].balance = response.coins / 1000000;
	      });
	 }

	 $scope.mainBackUp = function(){

	 }

	 $scope.openQR = function (address) {

      var modalInstance = $modal.open({
        templateUrl: 'qrModalContent.html',
        controller: "qrInstanceCtrl",
        resolve: {
          address: function () {
            return address;
          }
        }
      });

      modalInstance.result.then(function () {
      }, function () {
        $log.info('Modal dismissed at: ' + new Date());
      });
    };

}])


.controller('qrInstanceCtrl', ['$http', '$scope', '$modalInstance', 'address',
  function($http, $scope, $modalInstance, address) {

  $scope.address = address;
  $scope.qro = {};
  $scope.qro.fm = address;

  $scope.$watch('qro.label', function() {
  	$scope.qro.new = 'skycoin:' + $scope.address.address + '?' + 'label=' + $scope.qro.label; //+ '&message=' + $scope.qro.message;
  });

  $scope.$watch('qro.message', function() {
  	$scope.qro.new = 'skycoin:' + $scope.address.address + '?' + 'label=' + $scope.qro.label; //+ '&message=' + $scope.qro.message;
  });


  $scope.ok = function () {
    $modalInstance.close($scope.selected.item);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
}]);