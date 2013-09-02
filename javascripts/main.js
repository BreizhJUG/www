"use strict";

var breizhjugApp = angular.module('breizhjugApp', ['ui.bootstrap']);

/*########### Routing config ###########*/
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

/*########### Controllers ###########*/
breizhjugApp.controller("menuController", function ($scope, $route, $rootScope, $location, Scroll) {
    $scope.isCollapsed = true;

    $scope.homeSectionClick = function (sectionId) {
        if ($route.current.templateUrl.indexOf('home') > 0) {
            Scroll.scrollTo(sectionId);
        } else {
            $rootScope.scrollTo = sectionId;
            $location.path("/home").search("");
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
    $scope.headers = [
        {src:"images/header/breizhjug.png"},
        {src:"images/header/Devoxx.png"},
        {src:"images/header/BreizhCamp.png"},
        {src:"images/header/GDG_Rennes.png"},
        {src:"images/header/BreizhKids.png"}];
    $scope.carouselOptions = {
        auto: true,
        controls: false
    };
});

breizhjugApp.controller("homeNextController", function ($scope, Events, Speakers) {
    Events.next().then(function (evt) {
        $scope.event = evt;
    });
});

breizhjugApp.controller("homeEventsController", function ($scope, Events) {
    Events.prev().then(function (resp) {
        $scope.events = resp;
        $scope.carouselOptions = {
            slideWidth: 250,
            minSlides: 1,
            maxSlides: 50,
            slideMargin: 5,
            pager: false,
            moveSlides: 1
        };
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

breizhjugApp.controller("speakersController", function ($scope, Speakers, $routeParams) {
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

    if ($routeParams.q == undefined) {
        $scope.search = '';
    }else{
        $scope.search = $routeParams.q;
    }
});

breizhjugApp.controller("speakerController", function ($scope, Speakers, $location) {
    $scope.goToEvents = function (speaker) {
        $location.path("/events").search("q", speaker.name);
    };
});

breizhjugApp.controller("eventsController", function ($scope, Events, $routeParams, $location) {
    $scope.converter = new Markdown.getSanitizingConverter();

    $scope.getSafeDescription = function (description) {
        if (description) {
            return $scope.converter.makeHtml(description);
        }
        return description;
    };

    $scope.goToSpeaker = function (speaker) {
        $location.path("/speakers").search("q", speaker.name);
    };


    Events.fetch().then(function (resp) {
        $scope.events = resp;
    });

    $scope.search = $routeParams.q;

    $scope.reverseDate = true;
});

/*########### Services ###########*/
/*
 * Gives access to the speakers
 */
breizhjugApp.factory("Speakers", function ($http, $q) {
    var API_URI = 'data/speakers.json';

    var fetch = function () {
        return $http.get(API_URI, {cache: true});
    };

    return {
        // return all the speakers
        fetch: fetch,

        // fetch the speakers of the event
        fetchEvent: function (event) {
            if (event.speakersId && event.speakersId.length > 0) {
                fetch().success(function (resp) {
                    var speakers = [];
                    for (var i = 0; i < resp.length; i++) {
                        var tmp = resp[i];
                        if (event.speakersId.indexOf(tmp.id) != -1) {
                            speakers.push(tmp);
                        }
                    }
                    event.speakers = speakers;
                });
            }
        }
    };
});

/*
 * Gives access to the team's member
 */
breizhjugApp.factory("Team", function ($http) {
    var API_URI = 'data/team.json';

    return {
        // return all the team's member
        fetch: function () {
            return $http.get(API_URI, {cache: true});
        }

    };
});

/*
 * Gives access to the events
 */
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
                    Speakers.fetchEvent(evt);
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
        // return all the events with their speakers fetched
        fetch: fetch,

        // returns the next event (the last one from the events list)
        next: function () {
            var defer = $q.defer();
            fetch().then(function (resp) {
                defer.resolve(resp[resp.length - 1]);
            });
            return defer.promise;
        },

        // returns the previous events (all but last one)
        prev: function () {
            var defer = $q.defer();
            fetch().then(function (resp) {
                defer.resolve(resp.slice(0, resp.length - 1));
            });
            return defer.promise;
        }
    };
});

/*
 * Service used to scroll to a section of the home page
 */
breizhjugApp.factory("Scroll", function () {
    var bodyElt = $('html, body');
    var menuSpacerElt = $("#menu-spacer");
    var menuPopupElt = $("#menu-popup");

    return {
        // scroll to the section id passed in parameter
        scrollTo: function (sectionId) {
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

/*########### Directives ###########*/
/*
 * Creates a twitter link with the account id passed in attribute 'name'
 */
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

/*
 * Creates a github link with the account id passed in attribute 'name'
 */
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

/*
 * Creates a mail link with the address passed in attribute 'name'
 */
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

/*
 * Init a carousel
 */
breizhjugApp.directive('carousel',function($timeout) {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {
            options: '='
        },
        template:  '<div class="bx-container">' +
                     '<ul ng-transclude></ul>' +
                   '</div>',
        link: function(scope, elm, attrs) {
            // we have to wait that the <li> are all rendered. 'options' is only set when we retrieve the elements we want to show
            scope.$watch('options', function(options) {
                if(options != undefined){
                    // options have been set at the same time as the elements we want to show.
                    // $timeout waits the current $digest to process.
                    $timeout(function(){
                        // the elements are rendered, we can init the slider
                        $(elm.children()[0]).bxSlider(options);
                    });
                }
            });
        }
    };
});

/*########### Filters ###########*/
/*
 * Filter events by name or speaker's name
 */
breizhjugApp.filter('eventsFilter', function () {
    return function (events, searchText) {
        var searchRegx = new RegExp(searchText, "i");
        if (searchText == undefined) {
            return events;
        }
        var result = [];
        for (var i = 0; i < events.length; i++) {
            var event = events[i];
            if (event.name.search(searchRegx) != -1) {
                result.push(event);
            } else if (event.speakers) {
                for (var j = 0; j < event.speakers.length; j++) {
                    if (event.speakers[j].name.search(searchRegx) != -1) {
                        result.push(event);
                        break;
                    }
                }
            }
        }
        return result;
    }
});
