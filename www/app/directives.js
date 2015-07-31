'use strict';

var app = angular.module('isopen-ionic');

app
    .directive('backgroundImage', function () {
        return function (scope, element, attrs) {
            restrict: 'A',
                attrs.$observe('backgroundImage', function (value) {
                    if (!value) {
                        value = 'assets/images/background1-blur.jpg';
                    }
                    var style = '<style> html:before{background-image:url(' + value + ');}</style>';
                    element.append(style);
                });
        };
    })
    .directive('backgroundFilter', function () {
        return function (scope, element, attrs) {
            restrict: 'A',
                attrs.$observe('backgroundFilter', function (value) {
                    var style = '<style>html:before{' + value + ')}</style>';
                    element.append(style);
                });
        };
    })
    .directive('toggleimageheight', function ($rootScope, SLIDER_HEIGHT, SLIDER_HEIGHT_EXTENDED) {
        var isExtHeight;
        return {
            restrict: 'A',
            link: function (scope, elem) {
                elem.bind('click', function () {
                    scope.$apply(function () {
                        if (isExtHeight) {
                            $rootScope.sliderImageHeight = SLIDER_HEIGHT;
                        }
                        else {
                            $rootScope.sliderImageHeight = SLIDER_HEIGHT_EXTENDED;
                        }
                        isExtHeight = !isExtHeight;
                    });
                });
            }
        };
    })
    .filter('itemPrice', function () {
        return function (input) {
            return input ? input : '---';
        };
    })
    .filter('itemDescription', function () {
        return function (input) {
            return input ? input : 'No description given';
        };
    })
    .filter('itemStatus', function () {
        return function (input) {
            return ((input * 1) === 10) ? 'item-inactive' : 'item-active';
        };
    })
    .filter('getById', function () {
        return function (input, id) {
            var i = 0, len = input.length;
            for (; i < len; i++) {
                if (+input[i].id === +id) {
                    return input[i];
                }
            }
            return null;
        };
    })
    .filter('storeAvatar', function (UserService) {
        return function (input) {
            var facebookProfile = UserService.getFacebookProfile();
            return input ? input : 'http://graph.facebook.com/' + facebookProfile.id + '/picture?type=large';
        };
    });
