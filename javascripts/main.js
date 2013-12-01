"use strict";

var breizhjugApp = angular.module('breizhjugApp', ['ngRoute', 'ui.bootstrap']);

/*########### Routing config ###########*/
breizhjugApp.config(function ($routeProvider) {
    $routeProvider
        .when('/home', {
            templateUrl: 'views/home.html',
            controller: 'homeController',
            resolve: {
                resolvedEvents: ['Events', function(Events){
                    return Events.fetch();
                }],
                resolvedTeam: ['Team', function(Team){
                    return Team.fetch();
                }]
            }
        })
        .when('/speakers', {
            templateUrl: 'views/speakers.html',
            controller: 'speakersController',
            resolve: {
                resolvedSpeakers: ['Speakers', function(Speakers){
                    return Speakers.fetch();
                }]
            }
        })
        .when('/events', {
            templateUrl: 'views/events.html',
            controller: 'eventsController',
            resolve: {
                resolvedEvents: ['Events', function(Events){
                    return Events.fetch();
                }]
            }
        })
        .otherwise({
            redirectTo: '/home'
        });
});

/*########### Controllers ###########*/
breizhjugApp.controller("rootController", function ($scope, $sce) {
    $scope.converter = new Markdown.getSanitizingConverter();

    $scope.getSafeDescription = function (description) {
        if (description) {
            return $sce.trustAsHtml($scope.converter.makeHtml(description));
        }
        return description;
    };
});

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
        }, 500);
    }
});

breizhjugApp.controller("homeHeadController", function ($scope) {
    $scope.headers = [
        {src:"images/header/breizhjug-h300.jpg"},
        {src:"images/header/Devoxx-h300.jpg", href:"https://regbe.devoxx.com/public#DV13"},
        {src:"images/header/BreizhCamp-h300.jpg", href:"http://www.breizhcamp.org"},
        {src:"images/header/GDG_Rennes-h300.jpg", href:"http://www.gdgrennes.org/"},
        {src:"images/header/BreizhKids-h300.jpg"}];
    $scope.carouselOptions = {
        auto: true,
        controls: false
    };
});

breizhjugApp.controller("homeNextController", function ($scope, Events) {
    Events.next().then(function (evt) {
        $scope.nextEvent = evt;
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

breizhjugApp.controller("speakersController", function ($scope, resolvedSpeakers, $routeParams) {
    $scope.speakers = resolvedSpeakers.data;

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
    $scope.goToSpeaker = function (speaker) {
        $location.path("/speakers").search("q", speaker.name);
    };

    Events.fetch().then(function(resp) {
        $scope.events = resp;
    });

    $scope.search = $routeParams.q;

    $scope.reverseDate = true;
});

/*########### Services ###########*/
/*
 * Gives access to the speakers
 */
breizhjugApp.factory("Speakers", function ($http) {
    var API_URI = 'data/speakers.json';

    var fetch = function () {
        return $http.get(API_URI, {cache: true});
    };

    return {
        // return all the speakers
        fetch: fetch
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
breizhjugApp.factory("Events", function ($http, $q, Speakers, DateParser) {
    var API_URI = 'data/events.json';
    var events;

    var fetch = function () {
        var defer = $q.defer();
        if (events) {
            defer.resolve(events);
        } else {
            var promises = [];
            var fetchedEvents;
            var fetchedSpeakers;

            // we fetch the events
            promises.push($http.get(API_URI).success(function(resp) {
                fetchedEvents = resp;
            }));

            // we also need to fetch the speakers
            promises.push(Speakers.fetch().success(function(resp) {
                fetchedSpeakers = resp;
            }));

            $q.all(promises).then(function () {
                // order from the newest to the oldest event
                fetchedEvents.sort(function (e1, e2) {
                    if (e1.date < e2.date) return 1;
                    else if (e1.date > e2.date) return -1;
                    else return 0;
                });

                events = [];
                for (var i = 0; i < fetchedEvents.length; i++) {
                    var event = fetchedEvents[i];

                    if (event.speakersId && event.speakersId.length > 0) {
                        var speakers = [];
                        for (var j = 0; j < fetchedSpeakers.length; j++) {
                            var tmp = fetchedSpeakers[j];
                            // IE8 don't know indexOf
                            if ($.inArray(tmp.id, event.speakersId) > -1) {
                                speakers.push(tmp);
                            }
                        }
                        event.speakers = speakers;
                    }

                    events.push(event);
                }

                defer.resolve(events);
            });
        }
        return defer.promise;
    };

    return {
        // return all the events with their speakers fetched and ordered by date from the newest to the oldest
        fetch: fetch,

        // returns the next event (event in future with the closest date)
        next: function () {
            var defer = $q.defer();
            fetch().then(function (resp) {
                var next = null;
                var currentDate = new Date();
                for (var i = 0; i < resp.length; i++) {
                    var current = resp[i];
                    if (currentDate > DateParser.parse(current.date)) {
                        break;
                    }
                    next = current;
                }
                defer.resolve(next);
            });
            return defer.promise;
        },

        // returns the previous events (all event in past ordered by date)
        prev: function () {
            var defer = $q.defer();
            fetch().then(function (resp) {
                if(!resp || resp.length == 0){
                    defer.resolve([]);
                }else{
                    // events are ordered, we search for the first event in the past
                    var index = 0;
                    var currentDate = new Date();
                    for (; index < resp.length; index++) {
                        var current = resp[index];
                        if (currentDate > DateParser.parse(current.date)) {
                            break;
                        }
                    }
                    defer.resolve(resp.slice(index, resp.length));
                }
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

/*
 * Service to parse date for IE8.
 * Found here : http://stackoverflow.com/questions/11020658/javascript-json-date-parse-in-ie7-ie8-returns-nan
 */
breizhjugApp.factory("DateParser", function () {
    var parse;

    var D = new Date('2011-06-02T09:34:29+02:00');
    if(!D || +D!== 1307000069000){
        parse = function(s){
            var day, tz,
                rx=/^(\d{4}\-\d\d\-\d\d([tT ][\d:\.]*)?)([zZ]|([+\-])(\d\d):(\d\d))?$/,
                p= rx.exec(s) || [];
            if(p[1]){
                day= p[1].split(/\D/);
                for(var i= 0, L= day.length; i<L; i++){
                    day[i]= parseInt(day[i], 10) || 0;
                };
                day[1]-= 1;
                day= new Date(Date.UTC.apply(Date, day));
                if(!day.getDate()) return NaN;
                if(p[5]){
                    tz= (parseInt(p[5], 10)*60);
                    if(p[6]) tz+= parseInt(p[6], 10);
                    if(p[4]== '+') tz*= -1;
                    if(tz) day.setUTCMinutes(day.getUTCMinutes()+ tz);
                }
                return day;
            }
            return NaN;
        }
    }
    else{
        parse = function(s){
            return new Date(s);
        }
    }

    var toUTCDate = function (date) {
        return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
    };

    return {
        parse: parse,
        parseToUTC: function (s) {
            return toUTCDate(parse(s));
        },
        plusHours: function (date, hours) {
            return new Date(date.getFullYear(), date.getMonth(), date.getDate(),
                date.getHours() + hours, date.getMinutes(), date.getSeconds(), date.getMilliseconds())
        }
    }
});

/*########### Directives ###########*/
/*
 * Creates a twitter link with the account id passed in attribute 'name'
 */
breizhjugApp.directive("twitterlink", function () {
    return {
        restrict: "A",
        scope: {
            name: "@"
        },
        template: '<a ng-show="name" class="twitter" ng-href="http://www.twitter.com/{{ name }}" target="_blank"><img src="images/twitter_icon.png"/><span>@{{ name }}</span></a>',
        replace: true
    }
});

/*
 * Creates a github link with the account id passed in attribute 'name'
 */
breizhjugApp.directive("githublink", function () {
    return {
        restrict: "A",
        scope: {
            name: "@"
        },
        template: '<a ng-show="name" class="github" ng-href="https://github.com/{{ name }}" target="_blank"><img src="images/github_icon.png"/><span>{{ name }}</span></a>',
        replace: true
    }
});

/*
 * Creates a mail link with the address passed in attribute 'name'
 */
breizhjugApp.directive("maillink", function () {
    return {
        restrict: "A",
        scope: {
            name: "@"
        },
        template: '<a ng-show="name" class="mail" ng-href="mailto:{{ name }}" target="_blank"><img src="images/mail_icon.png"/><span>{{ name }}</span></a>',
        replace: true
    }
});

/*
 * Init a carousel
 */
breizhjugApp.directive('carousel',function($timeout) {
    return {
        restrict: 'A',
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

/*
 * Build a google calendar link from event
 */
breizhjugApp.directive('calendar', function (DateParser, $filter) {
    return {
        restrict: 'A',
        scope: {
            event: '='
        },
        link: function (scope, elm) {
            scope.$watch('event', function () {
                if (!scope.event) {
                    return;
                }

                var text = " " + $filter('date')(scope.event.date, "EEEE dd MMMM 'à' HH'h'mm");

                var eventDateUTCStart = DateParser.parseToUTC(scope.event.date);
                if (eventDateUTCStart.getTime() > Date.now()) {
                    var gcalFormat = "yyyyMMdd'T'HHmmss'Z'";

                    var eventDateUTCEnd = DateParser.plusHours(eventDateUTCStart, 2);

                    var link = "http://www.google.com/calendar/event?action=TEMPLATE"
                        + "&text=" + scope.event.name
                        + "&dates=" + $filter('date')(eventDateUTCStart, gcalFormat) + "/" + $filter('date')(eventDateUTCEnd, gcalFormat)
                        + "&details=" + scope.event.resume
                        + "&location=" + scope.event.place
                        + "&trp=false&sprop=BreizhJUG&sprop=name:http%3A%2F%2Fwww.breizhjug.org";

                    elm[0].innerHTML = "<a href=\"" + link + "\" target=\"_blank\">" + text + "</a>";

                } else {
                    elm[0].innerHTML = text;
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
