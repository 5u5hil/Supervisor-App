var app = angular.module("occupyparking", ['ngSanitize']);





app.controller("homeCtrl", function ($scope, $http) {

    $scope.bookings = [];
    if (online()) {
        $.ajax({
            url: apiEndpoint + 'getTodaysBookingsByLot',
            type: 'get',
            data: {pid: get('user').parkingLot},
            success: function (data) {
                $scope.$applyAsync(function () {
                    $scope.bookings = data;
                });
                set("bookings", {lastSync: new Date(), data: data});
            }
        });

    } else {
        if (get('bookings') != null)
            $scope.bookings = get('bookings').data;
    }

});

function req(url, data, type) {


}