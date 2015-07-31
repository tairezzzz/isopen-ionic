'use strict';

angular.module('isopen-ionic')
    .value('app-version', '0.0.2')
    .constant('API_URL', 'http://api.instastore.us/')
    .constant('SLIDER_HEIGHT', 310)
    .constant('SLIDER_HEIGHT_EXTENDED', 390)
    .constant('CLIENT_URL', 'http://instastore.us/')
    .constant('ITEM_STATUS', {temp: 0, inactive: 10, active: 20});
