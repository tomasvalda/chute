'use strict';

// # Chute.API.Heart
//
// Heart represents a user's like on an asset. Unlike votes, users can heart multiple assets from the same album.
angular.module('chute').factory('Chute.API.Heart',
  ['$resource', '$http', 'apiUrl', function($resource, $http, apiUrl) {

  var HeartResource = $resource(apiUrl + '/hearts/:collectionRoute:id/:memberRoute', {
    id: '@id',
    collectionRoute: '@collectionRoute',
    memberRoute: '@memberRoute'
  }, {
    /* custom resource methods */
  });

  // ## heart.$remove / heart.$delete
  //
  // Remove instance of heart returned by [Asset.heart](Asset.html#heart).
  //
  // **@params**
  //
  // - `params` {object} - can be empty since we don't need to send any params
  // - `success` {function}
  // - `error` {function}
  //
  // **@example**
  //
  // ```js
  // var heart = asset.heart();
  // heart.$remove();  // or heart.$delete();
  // ```
  HeartResource.prototype.$remove = HeartResource.prototype.$delete = function(params, success, error) {
    success = (success || angular.noop);
    error   = (error || angular.noop);

    $http['delete'](apiUrl + '/hearts/' + this.identifier).success(success).error(error);
  };

  return HeartResource;
}]);