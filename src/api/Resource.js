'use strict';

// # Chute.API.Resouce
//
// Abstract class that provides common behavior for Chute API resources and serializing data.
angular.module('chute').factory('Chute.API.Resource',
  ['$resource', '$http', function($resource, $http) {

  var ResourceFactory = function(url, paramDefaults, actions) {
    url = url || '';
    paramDefaults = paramDefaults || {};
    actions = angular.extend(actions || {}, {query: {method: 'GET', isArray: false}});

    var Resource = $resource(url, paramDefaults, actions);

    var PER_PAGE = 5;

    // <a name="Collection"></a>
    // ## Collection
    // 
    // Collection of resources returned by `Resource.query`.
    Resource.Collection = {
      // ### Collection.prevPage
      //
      // Fetch previous page of collection and prepend them to current instance of collection.
      //
      // When the collection are sorted naturally (`sort` param is 'id', 'time' or none), continuous paging is used. Otherwise uses standard paging (using `page` param).
      //
      // **@params**
      //
      // - `success` {function} - will be passed these arguments:
      //   - {array} detached set of newly fetched collection (in case you need them)
      //   - {object} response headers
      // - `error` {function}
      //
      // **@example**
      // ```js
      // var collection = Asset.query({album: 'abcqsrlx', page: 10});
      // collection.prevPage();
      // ```
      prevPage: function(success, error) {
        this.params.page--;

        var params = angular.copy(this.params);

        if (this.params.page <= 0) {
          throw new RangeError("Cannot fetch previous page with index " + this.params.page + ".");
        }
        
        var collection = this;
        Resource._query(params, function(response) {
          var newCollection = angular.extend([], {params: angular.copy(collection.params)}, Resource.Collection);
          if (response && response.data) {
            angular.forEach(response.data, function(data) {
              newCollection.push(new Resource(data));
            });
            /* prepend new collection to the original array */
            collection.unshift.apply(collection, newCollection);
          }
          (success||angular.noop)(newCollection, response.headers);
        }, error);
      },

      // ### Collection.nextPage
      //
      // Fetch next page of collection and append resources to current instance of collection.
      //
      // **@params**
      //
      // - `success` {function} - will be passed these arguments:
      //   - {array} detached set of newly fetched resources (in case you need them)
      //   - {object} response headers
      // - `error` {function}
      //
      // **@example**
      // ```js
      // var assets = Asset.query({album: 'abcqsrlx'});
      // assets.nextPage();
      // ```
      nextPage: function(success, error) {
        this.params.page++;

        var params = angular.copy(this.params);

        var collection = this;
        Resource._query(params, function(response) {
          var newCollection = angular.extend([], {params: angular.copy(collection.params)}, Resource.Collection);
          if (response && response.data) {
            angular.forEach(response.data, function(data) {
              newCollection.push(new Resource(data));
            });
            /* append new asssets to the original array */
            collection.push.apply(collection, newCollection);
          }
          if (!response || !response.data || response.data.length != (params.per_page || PER_PAGE)) {
            collection._hasMore = false;
          }
          (success||angular.noop)(newCollection, response.headers);
        }, error);
      },

      // ### Collection.hasMore
      //
      // Check if there are more resources available.
      //
      // This method doesn't trigger any external request. The resolution is based on the result of the last query (if it returned less than requested number of items, it's a signal there are no more available).
      //
      // **@returns** {boolean}
      //
      // - true if there are more resources on the server;
      // - false if we have reached the end
      //
      // **@example**
      // ```js
      // var collection = Asset.query({album: 'abcqsrlx'});
      // if (collection.hasMore()) {
      //   collection.nextPage();
      // }
      // ```
      hasMore: function() {
        return !! this._hasMore;
      }
    };

    // <a name="query"></a>
    // ## Resource.query
    //
    // Fetch resource collection. Overwrites default `$resource.query` method, maintaining the same API.
    // 
    // See [$resource docs](http://docs.angularjs.org/api/ngResource.$resource) for more information.
    //
    // **@params**
    //
    // - `params` {object} - see [Chute API docs](http://www.getchute.com/developers/reference/chute-api/v2/) for query params
    // - `success` {function}
    // - `error` {function}
    //
    // **@return** {array} [Collection](#Collection). Has additional functions (see above):
    // 
    // - `nextPage` - fetch next page using same params as for query
    // - `prevPage` - fetch previous page using same params as for query
    // - `hasMore` - whether next page of collection is available
    // 
    // **@example**
    // ```js
    // $scope.assets = Asset.query({album: 'abcqsrlx'});
    // ```
    Resource._query = Resource.query;
    Resource.query = function(params, success, error) {
      params = params || {};

      if (params.perPage) {
        params.per_page = params.perPage;
        delete params.perPage;
      }

      var saveParams = angular.extend({page: 1}, params);
      /* this is a nice trick to get array with helper functions */
      var collection = angular.extend([], {params: saveParams}, Resource.Collection);

      Resource._query(params, function(response) {
        if (response && response.data) {
          collection.length = 0;
          angular.forEach(response.data, function(data) {
            collection.push(new Resource(data));
          });

          if (response.data.length < (params.per_page || PER_PAGE) || !response.pagination || !response.pagination.next_page) {
            collection._hasMore = false;
          } else {
            collection._hasMore = true;
          }
        }
        (success||angular.noop)(collection, response.headers);
      }, error);

      return collection;
    };

    // <a name="get"></a>
    // ## Resource.get
    //
    // Fetch resource. Overwrites default `$resource.get` method, maintaining the same API.
    // 
    // See [$resource docs](http://docs.angularjs.org/api/ngResource.$resource) for more information.
    // 
    // **@params**
    //
    // - `params` {object} - see [Chute API docs](http://www.getchute.com/developers/reference/chute-api/v2/)
    // - `success` {function}
    // - `error` {function}
    //
    // **@return** {object} resource object that will be eventually filled with data
    //
    // **@example**
    // ```js
    // var asset = Asset.get({album: 'abcqsrlx', asset: 'vjp3miwob'});
    // ```
    Resource._get = Resource.get;
    Resource.get = function(params, success, error) {
      success = (success || angular.noop);
      error   = (error   || angular.noop);

      var data = {};

      var resource = this instanceof Resource ? this : new Resource(data);

      Resource._get(params, function(response) {
        angular.copy(response.data, resource);
        success(response.data, response.headers);
      }, error);

      return resource;
    };  

    return Resource;
  };

  return ResourceFactory;
}]);