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
        .when('/events', {
            templateUrl: 'views/events.html',
            controller: 'eventsController'
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

    $scope.getSafeDescription = function (description) {
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

breizhjugApp.controller("speakersController", function ($scope, Speakers, $location) {
    $scope.converter = new Markdown.getSanitizingConverter();

    $scope.getSafeDescription = function (description) {
        if (description) {
            return $scope.converter.makeHtml(description);
        }
        return description;
    };

    Speakers.fetch().success(function (resp) {
        $scope.speakers = resp;
    });
});

breizhjugApp.controller("speakerController", function ($scope, Speakers, $location) {
    $scope.goToEvents = function (speaker) {
        $location.path("/events").search("speaker=" + speaker.name);
    };
});

breizhjugApp.controller("eventsController", function ($scope, Events, Speakers, $routeParams) {
    $scope.converter = new Markdown.getSanitizingConverter();

    $scope.getSafeDescription = function (description) {
        if (description) {
            return $scope.converter.makeHtml(description);
        }
        return description;
    };

    Events.fetch().then(function (resp) {
        $scope.events = resp;
    });

    $scope.search = $routeParams.speaker;
});

breizhjugApp.factory("Speakers", function ($http, $q) {
    var API_URI = 'data/speakers.json';

    var fetch = function () {
        return $http.get(API_URI, {cache: true});
    };

    return {
        fetch: fetch,

        fetchEvent: function (event) {
            fetch().success(function (resp) {
                var speakers = [];
                for (var i = 0; i < resp.length; i++) {
                    var tmp = resp[i];
                    if (event.speakers.indexOf(tmp.id) != -1) {
                        speakers.push(tmp);
                    }
                }
                event.speakers = speakers;
            });
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

breizhjugApp.factory("Events", function ($http, $q, Speakers) {
    var API_URI = 'data/events.json';
    var events;

    var fetch = function () {
        var defer = $q.defer();
        if (events) {
            defer.resolve(events);
        } else {
            $http.get(API_URI).success(function (resp) {
                events = [];
                for (var i = 0; i < resp.length; i++) {
                    var evt = resp[i];
                    if (evt.speakers && evt.speakers.length > 0) {
                        Speakers.fetchEvent(evt);
                    }
                    events.push(evt);
                }
                defer.resolve(events);
            }).error(function (resp) {
                    defer.reject(resp);
                });
        }
        return defer.promise;
    };

    return {
        fetch: fetch,

        next: function () {
            var defer = $q.defer();
            fetch().then(function (resp) {
                defer.resolve(resp[resp.length - 1]);
            });
            return defer.promise;
        },

        prev: function () {
            var defer = $q.defer();
            fetch().then(function (resp) {
                defer.resolve(resp.slice(0, resp.length - 1));
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

breizhjugApp.directive("twitterlink", function () {
    return {
        restrict: "E",
        scope: {
            name: "@"
        },
        template: "<a ng-show=\"name\" class=\"twitter\" ng-href=\"http://www.twitter.com/{{ name }}\"><img src=\"/images/twitter_icon.png\"/><span>@{{ name }}</span></a>",
        replace: true
    }
});

breizhjugApp.directive("githublink", function () {
    return {
        restrict: "E",
        scope: {
            name: "@"
        },
        template: "<a ng-show=\"name\" class=\"github\" ng-href=\"https://github.com/{{ name }}\"><img src=\"/images/github_icon.png\"/><span>{{ name }}</span></a>",
        replace: true
    }
});

breizhjugApp.directive("maillink", function () {
    return {
        restrict: "E",
        scope: {
            name: "@"
        },
        template: "<a ng-show=\"name\" class=\"mail\" ng-href=\"mailto:{{ name }}\"><img src=\"/images/mail_icon.png\"/><span>{{ name }}</span></a>",
        replace: true
    }
});
