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


    $scope.checkin = function (oid) {

        var data = {oid: oid, userId: get('user').ID};
        var url = apiEndpoint + 'checkin';
        var type = 'POST';


        var r = confirm("Confirm Checkin?");
        if (r == true) {

            if (online()) {
                $.ajax({
                    url: url,
                    type: type,
                    data: data,
                    success: function (data) {
                        $scope.$applyAsync(function () {
                            if (data) {
                                objIndex = $scope.bookings.findIndex((obj => obj.id == oid));
                                $scope.bookings[objIndex].bstatus = 2;
                            }
                        });
                        set("bookings", {lastSync: new Date(), data: $scope.bookings});
                    }
                });

            } else {
                if (get('toSync') != null || !isArray(get('toSync')))
                    set("toSync", JSON.stringify([]));

                var toSync = get('toSync');
                toSync.push({url: url, data: data, type: type, pushedOn: new Date()});
                set('toSync', toSync);

            }
        }


    }


    $scope.minout = function (oid, type) {

        var data = {oid: oid, userId: get('user').ID, type: type};
        var url = apiEndpoint + 'minout';
        var type = 'POST';


        var r = type == 1 ? confirm("Confirm Checkin?") : confirm("Confirm Checkout?");
        if (r == true) {

            if (online()) {
                $.ajax({
                    url: url,
                    type: type,
                    data: data,
                    success: function (data) {
                        $scope.$applyAsync(function () {
                            if (data) {
                                var dt = new Date();
                                var h = dt.getHours(), m = dt.getMinutes();
                                var time = (h > 12) ? (h - 12 + ':' + m + ' PM') : (h + ':' + m + ' AM');

                                objIndex = $scope.bookings.findIndex((obj => obj.id == oid));
                                $scope.bookings[objIndex].stime = time;

                                if (type == 1)
                                    $scope.bookings[objIndex].checkin_time = data;
                                else
                                    $scope.bookings[objIndex].checkout_time = data;
                            }
                        });
                        set("bookings", {lastSync: new Date(), data: $scope.bookings});
                    }
                });

            } else {
                if (get('toSync') != null || !isArray(get('toSync')))
                    set("toSync", JSON.stringify([]));

                var toSync = get('toSync');
                toSync.push({url: url, data: data, type: type, pushedOn: new Date()});
                set('toSync', toSync);

            }
        }


    }

});

function req(url, data, type) {


}