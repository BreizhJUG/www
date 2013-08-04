"use strict";

var breizhjugApp = angular.module('breizhjugApp', []);

breizhjugApp.config(function ($routeProvider) {
    $routeProvider
        .when('/home/:scrollTo', {
            templateUrl: 'views/home.html',
            controller: 'homeController'
        })
        .when('/speakers', {
            templateUrl: 'views/speakers.html',
            controller: 'speakersController'
        })
        .otherwise({
            redirectTo: '/home/'
        });
});

breizhjugApp.controller("homeController", function ($scope, $route, $location, $anchorScroll) {
    // hack to make internal links on the page works
    // saving the current route
    var lastRoute = $route.current;
    // scroll to the section
    $location.hash($route.current.params.scrollTo);
    $anchorScroll();
    // change the url so we can move to a section even if the url didn't change
    $location.hash(':');

    $scope.$on('$locationChangeSuccess', function (event) {
        // if we try to move to the same page, it means we want to go to a section of the page. we scroll to it and told angular it's the same route to not reload the page.
        if ($route.current.templateUrl.indexOf('home') > 0) {
            $location.hash($route.current.params.scrollTo);
            $anchorScroll();
            $location.hash(':');
            $route.current = lastRoute;
        }
    });
});

breizhjugApp.controller("homeHeadController", function ($scope) {
    // initialize the slider
    $('.headSlider').bxSlider({
        auto: true
    });
});

breizhjugApp.controller("homeNextController", function ($scope, Events, Speakers) {
    Events.next().then(function (evt) {
        $scope.event = evt;
        if (evt.speakers && evt.speakers.length > 0) {
            Speakers.fetchSome(evt.speakers).then(function (speakers) {
                $scope.speakers = speakers;
            });
        }
    });
});

breizhjugApp.controller("homeEventsController", function ($scope, Events) {
    Events.prev().then(function (resp) {
        $scope.events = resp;
        // FIXME find a better way to achieve this, it's not even working properly when resizing the window.
        setTimeout(function () {
            // initialize the slider
            $('.eventsCarousel').bxSlider({
                slideWidth: 250,
                minSlides: 1,
                maxSlides: 5,
                slideMargin: 2,
                infiniteLoop: false,
                hideControlOnEnd: true,
                pager: false
            });
        }, 1000);
    });
});

breizhjugApp.controller("homeSpeakersController", function ($scope, Speakers) {
    Speakers.fetch().success(function (resp) {
        resp.sort(function (a, b) {
            return Math.random() - 0.5;
        });
        resp.length = 2;
        $scope.speakers = resp;
    });
});

breizhjugApp.controller("homeNewsController", function ($scope) {

});

breizhjugApp.controller("homeTeamController", function ($scope, Team) {
    Team.fetch().success(function (resp) {
        $scope.team = resp;
    });
});

breizhjugApp.controller("homeSponsorsController", function ($scope) {

});

breizhjugApp.controller("speakersController", function ($scope, Speakers) {
    Speakers.fetch().success(function (resp) {
        $scope.speakers = resp;
    });
});

breizhjugApp.factory("Speakers", function ($http, $q) {
    var API_URI = '/data/speakers.json';

    var fetch = function () {
        return $http.get(API_URI, {cache: true});
    };

    return {
        fetch: fetch,

        fetchOne: function (id) {
            var defer = $q.defer();
            fetch().success(function (resp) {
                var speaker;
                for (var i = 0; i < resp.length; i++) {
                    var tmp = resp[i];
                    if (tmp.id == id) {
                        speaker = tmp;
                        break;
                    }
                }
                if (speaker) {
                    defer.resolve(speaker);
                } else {
                    defer.reject('Not found');
                }
            }).error(function (resp) {
                    defer.reject(resp);
                });
            return defer.promise;
        },

        fetchSome: function (ids) {
            var defer = $q.defer();
            fetch().success(function (resp) {
                var speakers = [];
                for (var i = 0; i < resp.length; i++) {
                    var tmp = resp[i];
                    if (ids.indexOf(tmp.id) != -1) {
                        speakers.push(tmp);
                    }
                }
                defer.resolve(speakers);
            }).error(function (resp) {
                    defer.reject(resp);
                });
            return defer.promise;
        }
    };
});

breizhjugApp.factory("Team", function ($http) {
    var API_URI = '/data/team.json';

    return {
        fetch: function () {
            return $http.get(API_URI, {cache: true});
        }

    };
});

breizhjugApp.factory("Events", function ($http, $q) {
    var API_URI = '/data/events.json';

    var fetch = function () {
        return $http.get(API_URI, {cache: true});
    };

    return {
        fetch: fetch,

        next: function () {
            var defer = $q.defer();
            fetch().success(function (resp) {
                defer.resolve(resp[resp.length - 1]);
            }).error(function (resp) {
                    defer.reject(resp);
                });
            return defer.promise;
        },

        prev: function () {
            var defer = $q.defer();
            fetch().success(function (resp) {
                defer.resolve(resp.splice(0, resp.length - 1));
            }).error(function (resp) {
                    defer.reject(resp);
                });
            return defer.promise;
        }
    };
});
