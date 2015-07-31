'use strict';
angular.module('isopen-ionic')
    .controller('ProfileIndex', ['$scope', 'UserService', 'toaster', 'rest', 'PreviousState', '$state', '$rootScope', 'uiGmapGoogleMapApi',
        function ($scope, UserService, toaster, rest, PreviousState, $state, $rootScope, uiGmapGoogleMapApi) {
            uiGmapGoogleMapApi.then(function (maps) {
            });

            $scope.profile = UserService.getProfile();
            if ($scope.profile.seller) {
                $scope.slides = [
                    {title: 'first'},
                    {title: 'second'},
                    {title: 'third'},
                    {title: 'fourth'}
                ];
            } else {
                $scope.slides = [
                    {title: 'first'},
                    {title: 'second'}
                ];
            }

            $scope.fullName = $scope.profile.first_name + ' ' + $scope.profile.last_name;

            var errorCallback = function (data) {
                toaster.clear();
                if (data.status == undefined) {
                    if (data.code == 23000) {
                        toaster.pop('error', "Field: Email has already been taken");
                    }
                    else {
                        angular.forEach(data, function (error) {
                            toaster.pop('error', "Field: " + error.field, error.message);
                        });
                    }
                }
                else {
                    toaster.pop('error', "code: " + data.code + " " + data.name, data.message);
                }
            };

            rest.path = 'v1/stores';
            rest.model($scope.profile.store.id).success(function (store) {
                $scope.store = store;
                $rootScope.bgUrl = store.bg_url;
            }).error(errorCallback);

            $scope.isFacebookOff = true;

            var facebookUser = UserService.getFacebookProfile();
            $scope.facebookUid = facebookUser.id;
            $scope.facebookLink = facebookUser.link;

            $scope.save = function () {
                rest.path = 'v1/profiles';
                rest.putModel($scope.profile).success(function () {
                        toaster.pop('success', "Profile saved");
                        UserService.setProfile($scope.profile);
                    }
                ).error(errorCallback);
            };

            $scope.saveUrl = function () {
                rest.path = 'v1/stores';
                rest.putModel($scope.profile.store).success(function (data) {
                    toaster.pop('success', "Store url saved");
                    $scope.profile.store.store_url = data.store_url;
                    UserService.setProfile($scope.profile);
                }).error(errorCallback);
            };

            $scope.toggleFacebookProfile = function () {
                $scope.isFacebookOff = !$scope.isFacebookOff;
                if ($scope.isFacebookOff) {
                    var user = UserService.getProfile();
                    $scope.profile.first_name = user.first_name;
                    $scope.profile.last_name = user.last_name;
                    $scope.profile.email = user.email;
                }
                else {
                    $scope.profile.first_name = facebookUser.first_name;
                    $scope.profile.last_name = facebookUser.last_name;
                    $scope.profile.email = facebookUser.email;
                }
            };

            $scope.goBack = function () {
                if (PreviousState.Name) {
                    if (PreviousState.Name == 'profilestore/') $state.go('grid');
                    else $state.go(PreviousState.Name, PreviousState.Params);
                }
                else
                    $state.go('grid');
            };

            $scope.makeMeSeller = function(val){
                if (val === 'demo'){
                    $scope.profile.status = 20;
                    rest.path = 'v1/profiles';
                    rest.putModel($scope.profile).success(function (profile) {
                            toaster.pop('success', "Profile saved");
                            $scope.profile.seller = true;
                            UserService.setProfile($scope.profile);
                            UserService.setIsSeller(true);
                            $state.go('grid', {storeurl:$scope.profile.store.store_url});
                        }
                    ).error(errorCallback);
                }
            };
        }])
    .
    controller('ProfileStoreIndex', ['$scope', 'UserService', 'rest', 'toaster', 'uiGmapGoogleMapApi', '$auth', function ($scope, UserService, rest, toaster, uiGmapGoogleMapApi, $auth) {
        uiGmapGoogleMapApi
            .then(function () {
                return uiGmapGoogleMapApi;
            })
            .then(function () {
                $scope.renderMap = true;
            });

        var errorCallback = function (data) {
            toaster.clear();
            if (data.status == undefined) {
                if (data.code == 23000) {
                    toaster.pop('error', "Field: Paypal Email has already been taken");
                }
                else {
                    angular.forEach(data, function (error) {
                        toaster.pop('error', "Field: " + error.field, error.message);
                    });
                }
            }
            else {
                toaster.pop('error', "code: " + data.code + " " + data.name, data.message);
            }
        };

        $scope.slides = [
            {title: 'first'},
            {title: 'second'},
            {title: 'third'},
            {title: 'fourth'},
            {title: 'fifth'}
        ];

        $scope.profile = UserService.getProfile();

        $scope.mainStoreUrl = UserService.getMainStoreUrl();

        $scope.save = function () {
            if ($scope.profile.store.place) {
                if ($scope.profile.store.place.types) {
                    if ($scope.profile.store.place.types.indexOf('street_address') > -1) {
                        $scope.profile.store.store_long = $scope.profile.store.place.geometry.location.k;
                        $scope.profile.store.store_lat = $scope.profile.store.place.geometry.location.D;
                        $scope.profile.store.address = $scope.profile.store.place.formatted_address;
                    } else {
                        toaster.pop('error', 'Invalid address')
                    }
                } else {
                    toaster.pop('error', 'Invalid address')
                }
            }
            $scope.profile.store.store_url = $scope.profile.store.store_name;
            rest.path = 'v1/stores';
            rest.putModel($scope.profile.store).success(function (store) {
                toaster.pop('success', "Store saved");
                delete $scope.profile.store.place;
                $scope.profile.store = store;
                UserService.setProfile($scope.profile);
            }).error(errorCallback);
        };

        $scope.linkInstagram = function () {
            $auth.authenticate('instagram')
                .then(function (response) {
                    if (response.data && response.data.id) {
                        $scope.profile.instagramId = response.data.id;
                        UserService.setProfile($scope.profile);
                    }
                });
        };
    }])
    .controller('CropUploadCtrl', ['$scope', '$stateParams', 'Upload', 'API_URL', 'toaster', '$window', 'UserService',
        function ($scope, $stateParams, Upload, API_URL, toaster, $window, UserService) {
            $scope.myImage = '';
            $scope.myCroppedImage = '';

            /**
             * Converts data uri to Blob. Necessary for uploading.
             * @param  {String} dataURI
             * @return {Blob}
             */
            var dataURItoBlob = function (dataURI) {
                var binary = atob(dataURI.split(',')[1]);
                var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
                var array = [];
                for (var i = 0; i < binary.length; i++) {
                    array.push(binary.charCodeAt(i));
                }
                return new Blob([new Uint8Array(array)], {type: mimeString});
            };

            var handleFileSelect = function (evt) {
                var file = evt.currentTarget.files[0];
                var reader = new FileReader();
                reader.onload = function (evt) {
                    $scope.$apply(function ($scope) {
                        $scope.myImage = evt.target.result;
                    });
                };
                reader.readAsDataURL(file);
            };

            angular.element(document.querySelector('#fileInput')).on('change', handleFileSelect);

            $scope.upload = function (files, isAvatar) {
                if (files && files.length) {
                    for (var i = 0; i < files.length; i++) {
                        var file = files[i];
                        Upload.upload({
                            url: API_URL + 'v1/uploader/store-images',
                            fields: {
                                'isAvatar': isAvatar
                            },
                            headers: {
                                'Content-Type': file.type
                            },
                            method: 'POST',
                            data: file,
                            file: file
                        }).progress(function (evt) {
                            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                            console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
                        }).success(function (data, status, headers, config) {
                            if (isAvatar > 0) {
                                UserService.setAvatar(data.image_url);
                            }
                            else {
                                UserService.setBg(data.image_url);
                            }
                            toaster.pop('success', 'File uploaded!');
                            console.log('file uploaded. Response: ' + data.image_url);
                        });
                    }
                }
            };

            $scope.uploadCrop = function () {
                $scope.upload([dataURItoBlob($scope.myCroppedImage)], 1);
                $scope.upload([dataURItoBlob($scope.myImage)], 0);
            };
        }]);