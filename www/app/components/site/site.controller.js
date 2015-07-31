//'use strict';

angular.module('isopen-ionic')
    .controller('SiteLogin', ['$scope', '$rootScope', 'rest', 'toaster', '$state', '$auth', 'UserService', 'SStorage',
        function ($scope, $rootScope, rest, toaster, $state, $auth, UserService, SStorage) {
            if (!UserService.isGuest()) {
                UserService.goToMainStore();
            }

            $scope.isSession = SStorage.isSessionStorageAvailable();

            $scope.authenticate = function (provider) {
                $auth.authenticate(provider).then(function (res) {
                    UserService.login(res.data.token);
                    UserService.setFacebookProfile(res.data.facebookProfile);
                    res.data.profile.stores = res.data.stores;
                    if (res.data.store) {
                        res.data.profile.store = res.data.store;
                        UserService.setBg(res.data.store.bg_url);
                        UserService.setAvatar(res.data.store.avatar_url);
                    }
                    else {
                        res.data.profile.store = {};
                    }
                    UserService.setProfile(res.data.profile);
                    var name = res.data.profile.first_name ? res.data.profile.first_name : res.data.facebookProfile.first_name;
                    toaster.pop('success', 'Welcome, ' + name + '!');
                    if (UserService.getInvitedStatus()) {
                        $state.go('sellorbuy');
                    }
                    else {
                        $state.go('storeselect');
                    }
                }, handleError);
            };

            function handleError(err) {
                if (err.data) {
                    toaster.pop('error', err.data);
                }
            }
        }])
    .controller('SiteHeader', ['$scope', '$state', 'ngDialog', 'UserService', function ($scope, $state, ngDialog, UserService) {
        'use strict';
        UserService.initStore();
        var profile = UserService.getProfile();
        $scope.sellerAllowed = profile.seller;

        $scope.logout = function () {
            UserService.logout();
            $state.go('login');
        };

        $scope.profile = function () {
            $state.go('profile');
        };

        $scope.clickToOpen = function () {
            ngDialog.open({template: 'app/components/item/additem.html', controller: 'ItemAdd'});
        };
    }])
    .controller('SellOrBuy', ['$scope', 'UserService', '$state', function ($scope, UserService, $state) {
        'use strict';
        $scope.facebookProfile = UserService.getFacebookProfile();

        var profile = UserService.getProfile();
        $scope.sellerAllowed = profile.seller;

        $scope.goAsBuyer = function () {
            UserService.setIsSeller(false);
            $state.go('grid', {storeurl: profile.seller ? profile.store.store_url : profile.inviter_url});
        };

        $scope.goAsSeller = function () {
            UserService.setIsSeller(true);
            $state.go('grid', {storeurl: profile.store.store_url});
        };
    }])
    .controller('SiteStoreSelect', ['$scope', 'UserService', '$state', 'rest', 'errorService', 'toaster', function ($scope, UserService, $state, rest, errorService, toaster) {
        'use strict';
        $scope.profile = UserService.getProfile();
        $scope.selectStore = function (inviter_id) {
            $scope.profile.inviter_id = inviter_id;
            rest.path = 'v1/profiles';
            rest.putModel($scope.profile).success(function (profile) {
                UserService.setProfile(profile);
                toaster.pop('success', 'Saved');
                $state.go('sellorbuy');
            }).error(errorService.alert);
        };
    }]);