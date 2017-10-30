var app = angular.module("occupyparking", ['ngSanitize']);

app.controller("homeCtrl", function ($scope, $http) {

    $scope.user = get('user')

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
                if (get('toSync') == null || !isArray(get('toSync')))
                    set("toSync", JSON.stringify([]));

                var toSync = get('toSync');
                toSync.push({url: url, data: data, type: type, pushedOn: new Date()});
                set('toSync', toSync);

            }
        }


    }


    $scope.minout = function (oid, otype) {

        var data = {oid: oid, userId: get('user').ID, type: otype};
        var url = apiEndpoint + 'minout';
        var type = 'POST';


        var r = confirm("Confirm " + (otype == 1 ? 'Checkin' : 'Checkout') + "?");
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
                                $scope.bookings[objIndex] = data;

                            }
                        });
                        set("bookings", {lastSync: new Date(), data: $scope.bookings});
                    }
                });

            } else {
                if (get('toSync') == null || !isArray(get('toSync')))
                    set("toSync", JSON.stringify([]));

                var toSync = get('toSync');
                toSync.push({url: url, data: data, type: type, pushedOn: new Date()});
                set('toSync', toSync);

            }
        }


    }



    $scope.addBooking = function () {
        var data = $("#addBooking").serialize();
        var url = apiEndpoint + 'addBooking';
        var type = 'POST';


        var r = confirm("Confirm Booking?");
        if (r == true) {

            if (online()) {
                $.ajax({
                    url: url,
                    type: type,
                    data: data,
                    success: function (data) {
                        if (data == 'Booking added') {
                            alert("Booking Added.");
                            $('#modal1').modal('close');
                            $('#addBooking').each(function () {
                                this.reset();
                            });
                        } else {
                            alert(data);
                        }
                    }
                });

            } else {
                if (get('toSync') == null || !isArray(get('toSync')))
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


$(document).ready(function () {
    $("input[name='search']").keyup(function (e) {
        var sterm = $(this).val();
        if (sterm == "") {

            $(".contact").show();
            $(".ftest1").click();

        } else {

            $(".contact").hide();
            $(".contact[data-booking-id='" + sterm + "']").show();
            $(".f" + $(".contact[data-booking-id='" + sterm + "']").parent().parent().parent().parent().attr('id')).click()

            $(".contact[data-vehicle-number='" + sterm + "']").show();
            $(".f" + $(".contact[data-vehicle-number='" + sterm + "']").parent().parent().parent().parent().attr('id')).click()


        }

    });
});