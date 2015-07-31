'use strict';

angular.module('isopen-ionic')
    .controller('ItemIndex', ['$scope', 'rest', 'toaster', 'UserService', '$stateParams', '$rootScope', '$state', 'feedHelper', 'errorService', '$filter', 'ITEM_STATUS',
        function ($scope, rest, toaster, UserService, $stateParams, $rootScope, $state, feedHelper, errorService, $filter, ITEM_STATUS) {

            $scope.$on('newItem', function (event, item) {
                if (item) $scope.items.push(item);
                $scope.showPanel = false;
            });

            if (!UserService.isGuest()) {
                var store;
                if (!UserService.isYourStore()) {

                    $rootScope.isSeller = false;

                    rest.path = 'v1/stores';
                    rest.models({store_url: $stateParams.storeurl}).success(function (data) {
                        $scope.store = store = data[0];
                        if (!store) {
                            errorService.simpleAlert('nostorewithurl');
                            $state.go('grid');
                            return;
                        }
                        rest.path = 'v1/items';
                        rest.models({user_id: store.user_id, status: ITEM_STATUS.active}).success(function (data) {
                            if (data.length === 0) $scope.showPanel = true;
                            $scope.items = data;
                        });
                    }).error(errorService.simpleAlert);
                }
                else {
                    $rootScope.isSeller = true;
                    rest.path = 'v1/user-items';
                    rest.models().success(function (data) {
                        if (data.length === 0) $scope.showPanel = true;
                        $scope.items = data;
                    }).error(errorService.simpleAlert);
                }

                $scope.seemore = function (go) {
                    feedHelper.seeMore = true;
                    $state.go('itemview', go);
                };

                $scope.leavecomment = function (go) {
                    feedHelper.leaveComment = true;
                    $state.go('itemview', go);
                };

                $scope.toggleItemStatus = function (item) {
                    if (item.status == ITEM_STATUS.inactive) {
                        item.status = ITEM_STATUS.active;
                    }
                    else {
                        item.status = ITEM_STATUS.inactive;
                    }
                    rest.putModel(item).success(function (data) {
                        var found = $filter('getById')($scope.items, data.id);
                        found.status = data.status;
                    }).error(errorService.alert);
                };
            }
        }])
    .controller('ItemView', ['$scope', 'rest', 'toaster', '$state', 'feedHelper', 'errorService',
        'UserService', '$stateParams', '$location', '$anchorScroll', '$timeout', 'API_URL', 'cfpLoadingBar',
        function ($scope, rest, toaster, $state, feedHelper, errorService, UserService, $stateParams,
                  $location, $anchorScroll, $timeout, API_URL, cfpLoadingBar) {

            $scope.item = {};

            //init Plupload-directive vars
            $scope.plupfiles = [];
            $scope.pluploadConfig = {};
            $scope.pluploadConfig.uploadPath = API_URL + 'v1/uploader/item-images?access-token=' + UserService.getToken();
            $scope.pluploadConfig.resize = {width: 310, height: 390, preserve_headers: false, quality: 100};

            if ($stateParams.itemurl) {
                rest.path = 'v1/items';
                rest.models({item_url: $stateParams.itemurl}).success(function (data) {
                    $scope.item = data[0];
                    $scope.pluploadConfig.multiParams = {itemId: data[0].id};
                }).error(errorService.alert);
            }
            else {
                errorService.simpleAlert('noitemwithurl');
                $state.go('grid');
            }

            $scope.save = function () {
                $scope.item.item_url = $scope.item.title;
                rest.path = 'v1/user-items';
                rest.putModel($scope.item).success(function (item) {
                    toaster.pop('success', "Saved");
                    $state.transitionTo('itemview', {storeurl: $stateParams.storeurl, itemurl: item.item_url, tab: 4});
                }).error(errorService.alert);
            };

            $scope.removeImage = function (thumb) {
                var index = $scope.item.images.indexOf(thumb);
                $scope.item.images.splice(index, 1);
                rest.path = 'v1/item-images/' + thumb.id;
                rest.deleteModel()
                    .success(function () {
                        toaster.pop('success', "Image deleted!");
                    })
                    .error(errorService.alert);
            };

            $scope.removeItem = function () {
                if ($scope.item.images) {
                    var index;
                    for (index = 0; index < $scope.item.images.length; ++index) {
                        $scope.removeImage($scope.item.images[index]);
                    }
                }
                rest.path = 'v1/items/' + $scope.item.id;
                rest.deleteModel()
                    .success(function () {
                        toaster.pop('success', "Item deleted!");
                        $state.go('grid');
                    })
                    .error(errorService.alert);
            };

            $scope.saveComment = function (comment) {
                rest.path = 'v1/comments';
                $scope.seeMore = true;
                rest.postModel({content: comment, item_id: $scope.item.id}).success(function () {
                    toaster.pop('success', "Commented");
                    $scope.item.comments.push({authorFullName: UserService.getUserFullName(), content: comment});
                    $scope.item.newComment = null;
                }).error(errorService.alert);
            };

            $scope.seeMore = false;
            if (feedHelper.seeMore) {
                $scope.seeMore = true;
                feedHelper.seeMore = false;
            }

            $scope.leaveComment = false;
            if (feedHelper.leaveComment) {
                $scope.leaveComment = true;
                feedHelper.leaveComment = false;
            }

            $scope.showCommentTabGoToBottom = function () {
                $scope.leaveComment = !$scope.leaveComment;
                $timeout(function () {
                    $location.hash('bottom');
                    $anchorScroll();
                }, 100);
            };

            //Plupload-directive handlers
            $scope.uploaded = function (data) {
                var res = JSON.parse(data.response);
                $scope.item.images.push({id: res.id, 'image_url': res.image_url});
                cfpLoadingBar.complete();
                toaster.pop('success', 'File uploaded!');
            };

            $scope.added = function () {
                cfpLoadingBar.start();
            };

            $scope.progress = function () {
                cfpLoadingBar.set($scope.percent);
            };
        }
    ])
    .
    controller('ItemAdd', ['$scope', 'rest', 'toaster', 'ITEM_STATUS', 'API_URL', 'ngDialog', 'errorService', 'UserService', 'cfpLoadingBar', '$rootScope',
        function ($scope, rest, toaster, ITEM_STATUS, API_URL, ngDialog, errorService, UserService, cfpLoadingBar, $rootScope) {
            $scope.item = {category_id: 9, brand_id: 1, description: ''};
            $scope.item.images = [];

            //init Plupload-directive vars
            $scope.plupfiles = [];
            $scope.pluploadConfig = {};
            $scope.pluploadConfig.resize = {width: 310, height: 390, preserve_headers: false, quality: 100};
            $scope.pluploadConfig.uploadPath = API_URL + 'v1/uploader/item-images?access-token=' + UserService.getToken();

            $scope.save = function () {
                if (!$scope.item.title) $scope.item.title = Math.random().toString(36).slice(2);
                $scope.item.item_url = $scope.item.title;
                $scope.item.status = ITEM_STATUS.active;
                if ($scope.item.id) {
                    rest.path = 'v1/items';
                    rest.putModel($scope.item).success(function (item) {
                        toaster.pop('success', "Saved");
                        $rootScope.$broadcast('newItem', item);
                    }).error(errorService.alert);
                } else {
                    rest.path = 'v1/items';
                    rest.postModel($scope.item).success(function (item) {
                        toaster.pop('success', "Saved");
                        $rootScope.$broadcast('newItem', item);
                    }).error(errorService.alert);
                }
                ngDialog.close();
            };

            //Plupload-directive handlers
            $scope.uploaded = function (data) {
                var res = JSON.parse(data.response);
                $scope.item.id = res.item_id;
                $scope.item.images.push({id: res.id, 'image_url': res.image_url});
                $scope.uploader.setOption('multipart_params', {itemId: res.item_id});
                cfpLoadingBar.complete();
                toaster.pop('success', 'File uploaded!');
            };

            $scope.added = function () {
                cfpLoadingBar.start();
            };

            $scope.progress = function () {
                cfpLoadingBar.set($scope.percent);
            };
        }
    ])
    .controller('ItemViewTabsCtrl', ['$scope', '$rootScope', '$timeout', '$stateParams', 'UserService', function ($scope, $rootScope, $timeout, $stateParams, UserService) {

        $scope.onClickTab = function (tab) {
            $scope.currentTab = tab.url;
        }

        $scope.isActiveTab = function (tabUrl) {
            UserService.init();
            return tabUrl == $scope.currentTab;
        }

        $scope.likeItem = function () {
            $rootScope.showHearts = true;
            $timeout(function () {
                $rootScope.showHearts = false;
            }, 1000);
        };

        if ($rootScope.isSeller)
            switch ($stateParams.tab) {
                case '1':
                    $scope.currentTab = 'app/components/item/view-tab-comment.html';
                    break;
                case '2':
                    $scope.currentTab = 'app/components/item/view-tab-log.html'
                    break;
                case '3':
                    $scope.currentTab = 'app/components/item/view-tab-social.html'
                    break;
                case '4':
                    $scope.currentTab = 'app/components/item/view-tab-edit.html'
                    break;
                default:
                    $scope.currentTab = 'app/components/item/view-tab-comment.html';
            }
        else
            switch ($stateParams.tab) {
                case '1':
                    $scope.currentTab = 'app/components/item/view-tab-comment.html';
                    break;
                case '2':
                    $scope.currentTab = 'app/components/item/view-tab-buy.html';
                    break;
                case '3':
                    $scope.currentTab = 'app/components/item/view-tab-comment.html';
                    $scope.likeItem();
                    break;
                case '4':
                    $scope.currentTab = 'app/components/item/view-tab-location.html';
                    break;
                default:
                    $scope.currentTab = 'app/components/item/view-tab-comment.html';
            }
    }])
    .controller('ItemLocation', ['$scope', '$rootScope', 'uiGmapGoogleMapApi', function ($scope, $rootScope, uiGmapGoogleMapApi) {
        uiGmapGoogleMapApi.then(function () {
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
    }])
    .controller('InstagramImport', ['$scope', '$http', 'API_URL', 'errorService', function ($scope, $http, API_URL, errorService) {
        $http.get(API_URL + 'v1/link/instagram-media').success(function (data) {
            $scope.items = data;
        }).error(errorService.alert);

        $scope.importItems = function () {
            var items = [];
            angular.forEach($scope.items, function (value) {
                if (value.isChecked === true) {
                    var item = {
                        description: value.caption ? value.caption.text : 'Item from Instagram',
                        image_url: value.images.standard_resolution.url
                    };
                    items.push(item);
                }
            });
            $http.post(API_URL + 'v1/uploader/item-import', items).success(function (data) {
                console.log(data);
            }).error(errorService.alert);
        };

        $scope.checkAll = function () {
            angular.forEach($scope.items, function (value) {
                value.isChecked = true;
            });
        };

        $scope.uncheckAll = function () {
            angular.forEach($scope.items, function (value) {
                value.isChecked = false;
            });
        };
    }]);
