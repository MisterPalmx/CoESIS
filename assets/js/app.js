var app = angular.module("app", ["ui.router"]);

app.constant("API_URL", "//api.palmz.me/coesis");

app.config(function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {

	$urlRouterProvider.otherwise("/");

	$stateProvider
	.state("studentList", {
		url: "/",
		templateUrl: "views/studentList.html",
    controller: "studentListCtrl",
	})
	.state("studentNew", {
		url: "/student/new",
		templateUrl: "views/studentNew.html",
    controller: "studentNewCtrl",
	})
	.state("studentView", {
		url: "/student/:id",
		templateUrl: "views/studentView.html",
    controller: "studentViewCtrl",
	})
	.state("eventList", {
		url: "/event",
		templateUrl: "views/eventList.html",
    controller: "eventListCtrl",
	})
	.state("eventNew", {
		url: "/event/new",
		templateUrl: "views/eventNew.html",
    controller: "eventNewCtrl",
	})
	.state("eventView", {
		url: "/event/:id",
		templateUrl: "views/eventView.html",
    controller: "eventViewCtrl",
	})
	.state("summary", {
		url: "/summary",
		templateUrl: "views/summary.html",
    controller: "summaryCtrl",
	})

	$locationProvider.html5Mode(true);

});

app.run(function($rootScope, $state, $http, API_URL, $window, $q) {

  $rootScope.preloader = true;
	$rootScope.students = [];
	$rootScope.events = [];

	var promises = [],
		studentP = $q.defer(),
		eventP = $q.defer();

	promises.push(studentP.promise);
	promises.push(eventP.promise);

	$http.get(API_URL + "/student")
	.success(function(response) {
		studentP.resolve();
		if (response.success) {
			$rootScope.students = response.data.students;
		}
	});

	$http.get(API_URL + "/event")
	.success(function(response) {
		eventP.resolve();
		if (response.success) {
			$rootScope.events = response.data.events;
		}
	});

	$q.all(promises).then(function() {
		$rootScope.preloader = false;
		console.log("Students", $rootScope.students);
		console.log("Events", $rootScope.events);
	});

});

app.controller("studentListCtrl", function($rootScope, $scope, $http, API_URL, $window, $state) {

});

app.controller("studentNewCtrl", function($rootScope, $scope, $http, API_URL, $window, $state) {

	$scope.add = function() {
		$scope.loading = true;
		$http.post(API_URL + "/student/new", {
			id: $scope.id,
			nickname: $scope.nickname,
			name: $scope.name,
			gender: $scope.gender,
			phone: $scope.phone,
			phone2: $scope.phone2,
			address: $scope.address,
			facebook: $scope.facebook,
		})
		.success(function(response) {
			$scope.loading = false;
			if (response.success) {
				alert("เพิ่มข้อมูลเรียบร้อยแล้ว!");
				$rootScope.preloader = true;
				$http.get(API_URL + "/student")
				.success(function(response) {
					$rootScope.preloader = false;
					$state.go("studentList");
					if (response.success) {
						$rootScope.students = response.data.students;
					}
				});
			} else {
				alert("Error! " + response.message);
			}
		})
	}
});

app.controller("studentViewCtrl", function($rootScope, $scope, $http, API_URL, $window, $state, $stateParams) {
	$scope.id = $stateParams.id;
	$scope.student = {};
	$scope.event = {};

	$scope.$watch('$root.students', function() {
		angular.forEach($rootScope.students, function(student) {
			if (student.id == $scope.id)
				$scope.student = student;
		});
	});

});

app.controller("eventListCtrl", function($rootScope, $scope, $http, API_URL, $window, $state) {

});

app.controller("eventNewCtrl", function($rootScope, $scope, $http, API_URL, $window, $state) {
	$scope.add = function() {
		$scope.loading = true;
		$http.post(API_URL + "/event/new", {
			name: $scope.name,
			description: $scope.description,
		})
		.success(function(response) {
			$scope.loading = false;
			if (response.success) {
				alert("เพิ่มข้อมูลเรียบร้อยแล้ว!");
				$rootScope.preloader = true;
				$http.get(API_URL + "/event")
				.success(function(response) {
					$rootScope.preloader = false;
					$state.go("eventList")
					if (response.success) {
						$rootScope.events = response.data.events;
					}
				});
			} else {
				alert("Error! " + response.message);
			}
		})
	}
});

app.controller("eventViewCtrl", function($rootScope, $scope, $http, API_URL, $window, $state, $stateParams) {
	$scope.id = $stateParams.id;
	$scope.event = {};

	$scope.$watch('$root.events', function() {
		angular.forEach($rootScope.events, function(event) {
			if (event.id == $scope.id)
				$scope.event = event;
		});
	});
});


app.controller("summaryCtrl", function($rootScope, $scope, $http, API_URL, $window, $state) {

});
