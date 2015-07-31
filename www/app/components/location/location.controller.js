'use strict';

angular.module('isopen-ionic')
    .controller('LocationIndex', ['$scope', '$rootScope', 'uiGmapGoogleMapApi', function ($scope, $rootScope, uiGmapGoogleMapApi) {
        uiGmapGoogleMapApi
            .then(function () {
                return uiGmapGoogleMapApi;
            })
            .then(function () {
                if ($rootScope.store) {
                    $scope.map = {
                        center: {latitude: $rootScope.store.store_long, longitude: $rootScope.store.store_lat},
                        zoom: 14
                    };
                    $scope.staticMarker = {id: 'store-marker'};
                    $scope.staticMarker.coords = {
                        latitude: $rootScope.store.store_long,
                        longitude: $rootScope.store.store_lat
                    };
                }
            });
    }]);