"use strict";

var breizhjugApp = angular.module('breizhjugApp', []);

breizhjugApp.config(function ($routeProvider) {
    $routeProvider
        .when('/home', {
            templateUrl: 'views/home.html',
            controller: 'homeController'
        })
        .when('/speakers', {
            templateUrl: 'views/speakers.html',
            controller: 'speakersController'
        })
        .otherwise({
            redirectTo: '/home'
        });
});

breizhjugApp.controller("menuController", function ($scope, $route, $rootScope, $location, Scroll) {
    $scope.homeSectionClick = function (sectionId) {
        if ($route.current.templateUrl.indexOf('home') > 0) {
            Scroll.scrollTo(sectionId);
        } else {
            $rootScope.scrollTo = sectionId;
            $location.path("/home");
        }
    };
});

breizhjugApp.controller("homeController", function ($scope, $rootScope, Scroll) {
    if ($rootScope.scrollTo) {
        var sectionId = $rootScope.scrollTo;
        $rootScope.scrollTo = null;
        setTimeout(function () {
            Scroll.scrollTo(sectionId);
        }, 2000);
    }

    $scope.converter = new Markdown.getSanitizingConverter();

    $scope.getSafeDescription = function(description) {
        if (description) {
            return $scope.converter.makeHtml(description);
        }
        return description;
    };
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
    $scope.converter = new Markdown.getSanitizingConverter();

    $scope.getSafeDescription = function(description) {
        if (description) {
            return $scope.converter.makeHtml(description);
        }
        return description;
    };

    Speakers.fetch().success(function (resp) {
        $scope.speakers = resp;
    });
});

breizhjugApp.factory("Speakers", function ($http, $q) {
    var API_URI = 'data/speakers.json';

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
    var API_URI = 'data/team.json';

    return {
        fetch: function () {
            return $http.get(API_URI, {cache: true});
        }

    };
});

breizhjugApp.factory("Events", function ($http, $q) {
    var API_URI = 'data/events.json';

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

breizhjugApp.factory("Scroll", function () {
    var bodyElt = $('html, body');
    var menuSpacerElt = $("#menu-spacer");
    var menuPopupElt = $("#menu-popup");

    return {
        scrollTo: function (sectionId) {
            // scroll to the section
            var diff = menuSpacerElt.height();
            if (diff == 0 && menuPopupElt.is(":visible")) {
                diff = menuPopupElt.height();
            }
            var scrollTop = ($("#" + sectionId).offset().top - diff);
            bodyElt.animate({
                scrollTop: scrollTop
            }, 1000);
        }
    }

});
