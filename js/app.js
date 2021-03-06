
var app = angular.module("occupyparking", ["ngSanitize"]);
var now = new Date();
var datetime = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
datetime += ' ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
console.log(datetime);
app.filter("timestampToISO", function () {
  return function (input) {
    if (input == '0000-00-00 00:00:00') {
      var now = new Date();
      var datetime = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
      datetime += ' ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
      input = datetime;
    }
    input = new Date(input).toISOString();
    return input;
  };
});

app.controller("homeCtrl", function ($scope, $http, $interval, $timeout, $rootScope) {
  $scope.isDisabled = false;
  $scope.monthlyBooking = false;
  getMonthlyBookingStatus();
  $scope.user = get("user");
  $scope.bookings = [];
  refresh();
  $interval(function () {
    refresh();
  }, 20000);

  $scope.ref = function () {
    refresh();
  };

  function refresh() {
    if (online()) {
      $.ajax({
        url: apiEndpoint + "getTodaysBookingsByLot",
        type: "get",
        data: {
          pid: get("user").parkingLot
        },
        success: function (data) {
          $scope.$applyAsync(function () {
            $scope.bookings = data;
            $scope.bookingData = data;
            var toSync = get("toSync");
            if (toSync) {
              var offlineData = [];
              for (var i = toSync.length - 1; i >= 0; i--) {
                offlineData.push(toSync[i].data);
              }
              $scope.bookings = offlineData.concat($scope.bookings);
            }
            if ($("input[name='search']").val() != "") {
              $timeout(function () {
                var e = $.Event("keyup");
                e.keyCode = 13; // enter
                $("input[name='search']").trigger(e);
              }, 100);
            }
          });
          set("bookings", {
            lastSync: new Date(),
            data: data
          });
        }
      });
    } else {
      var toSync = get("toSync");
      if (toSync) {
        var offlineData = [];
        for (var i = toSync.length - 1; i >= 0; i--) {
          offlineData.push(toSync[i].data);
        }
        var bookingData = offlineData.concat(get("bookings").data);
        if (get("bookings") != null) $scope.bookings = bookingData;
      } else {
        if (get("bookings") != null) $scope.bookings = get("bookings").data;
      }
    }
  }


  $scope.ncheckout = function (oid) {
    var data = {
      oid: oid,
      userId: get("user").ID,
      pid: get("user").parkingLot
    };
    var url = apiEndpoint + "checkout";
    var type = "POST";

    if (online()) {
      $.ajax({
        url: url,
        type: type,
        data: data,
        success: function (res) {
          alert(res[0]);
          data.famt = res[1];
          data.fcharge = res[2];
          data.discount = res[3];
          var r = confirm("Confirm Checkout?");
          if (r == true) {
            $.ajax({
              url: apiEndpoint + "confirmCheckout",
              type: "POST",
              data: data,
              success: function (meh) {
                $scope.$applyAsync(function () {
                  if (meh == 1) {
                    objIndex = $scope.bookings.findIndex(obj => obj.id == oid);
                    $scope.bookings[objIndex].bstatus = 3;

                    toast("Checkout Done");
                  } else {
                    toast("Oops ... looks like something went wrong.");
                  }
                });
              }
            });
          }
          set("bookings", {
            lastSync: new Date(),
            data: $scope.bookings
          });
        }
      });
    } else {
      alert(
        "No Internet Connection. Please click the sync button once connected back to the internet."
      );
      if (get("toSync") == null || !isArray(get("toSync")))
        set("toSync", JSON.stringify([]));

      var toSync = get("toSync");
      toSync.push({
        url: url,
        data: data,
        type: type,
        pushedOn: new Date(),
        checkin_time: datetime
      });
      set("toSync", toSync);
    }
  };

  $scope.scheckout = function (oid, time) {
    var data = {
      oid: oid,
      userId: get("user").ID
    };
    var url = apiEndpoint + "scheckout";
    var type = "POST";

    var startDate = new Date(time).getTime();
    var endDate = new Date().getTime();

    var timeStart = new Date(time).getTime();
    var timeEnd = new Date().getTime();
    var hourDiff = timeEnd - timeStart; //in ms
    var secDiff = hourDiff / 1000; //in s
    var minDiff = hourDiff / 60 / 1000; //in minutes
    var hDiff = hourDiff / 3600 / 1000; //in hours
    var humanReadable = {};
    humanReadable.hours = Math.floor(hDiff);
    humanReadable.minutes = Math.ceil(minDiff - 60 * humanReadable.hours);

    var amt = prompt(
      "Total Parked Time : " +
      humanReadable.hours +
      " Hours " +
      humanReadable.minutes +
      " Mins. \nEnter Amount Collected",
      ""
    );

    if (amt != null) {
      data.amt = amt;

      var r = confirm("Confirm Checkout?");
      if (r == true) {
        if (online()) {
          $.ajax({
            url: url,
            type: type,
            data: data,
            success: function (data) {
              $scope.$applyAsync(function () {
                if (data == 1) {
                  objIndex = $scope.bookings.findIndex(obj => obj.id == oid);
                  $scope.bookings[objIndex].bstatus = 3;
                  toast("Checkout Done");
                } else {
                  toast("Oops ... looks like something went wrong.");
                }
              });
              set("bookings", {
                lastSync: new Date(),
                data: $scope.bookings
              });
            }
          });
        } else {
          alert(
            "No Internet Connection. Please click the sync button once connected back to the internet."
          );
          if (get("toSync") == null || !isArray(get("toSync")))
            set("toSync", JSON.stringify([]));

          var toSync = get("toSync");
          toSync.push({
            url: url,
            data: data,
            type: type,
            pushedOn: new Date(),
            checkin_time: datetime
          });
          set("toSync", toSync);
        }
      }
    } else {
      toast("Please enter the amount collected.");
    }
  };

  $scope.checkin = function (oid) {
    var data = {
      oid: oid,
      userId: get("user").ID
    };
    var url = apiEndpoint + "checkin";
    var type = "POST";

    var r = confirm("Confirm Checkin?");
    if (r == true) {
      if (online()) {
        $.ajax({
          url: url,
          type: type,
          data: data,
          success: function (data) {
            $scope.$applyAsync(function () {
              if (data == 1) {
                objIndex = $scope.bookings.findIndex(obj => obj.id == oid);
                $scope.bookings[objIndex].bstatus = 2;
                toast("Checkin Done");
              } else {
                toast("Oops ... looks like something went wrong.");
              }
            });
           set("bookings", {
              lastSync: new Date(),
              data: $scope.bookings
            });
          }
        });
      } else {
        alert(
          "No Internet Connection. Please click the sync button once connected back to the internet."
        );

        if (get("toSync") == null || !isArray(get("toSync")))
          set("toSync", JSON.stringify([]));

        var toSync = get("toSync");
        toSync.push({
          url: url,
          data: data,
          type: type,
          pushedOn: new Date()
        });
        set("toSync", toSync);
      }
    }
  };

  $scope.minout = function (oid, otype) {
    var data = {
      oid: oid,
      userId: get("user").ID,
      type: otype
    };
    var url = apiEndpoint + "minout";
    var type = "POST";
    var msg = otype == 1 ? "Checkin Done" : "Checkout Done";

    var r = confirm("Confirm " + (otype == 1 ? "Checkin" : "Checkout") + "?");
    if (r == true) {
      if (online()) {
        $.ajax({
          url: url,
          type: type,
          data: data,
          success: function (data) {
            $scope.$applyAsync(function () {
              if (data) {
                objIndex = $scope.bookings.findIndex(obj => obj.id == oid);
                $scope.bookings[objIndex] = data;
                toast(msg);
              }
            });
            set("bookings", {
              lastSync: new Date(),
              data: $scope.bookings
            });
          }
        });
      } else {
        alert(
          "No Internet Connection. Please click the sync button once connected back to the internet."
        );

        if (get("toSync") == null || !isArray(get("toSync")))
          set("toSync", JSON.stringify([]));

        var toSync = get("toSync");
        toSync.push({
          url: url,
          data: data,
          type: type,
          pushedOn: new Date()
        });
        set("toSync", toSync);
      }
    }
  };

  $scope.updateBooking = function () {
    var data = $("#editBooking").serialize();
    var url = apiEndpoint + "updateBooking";
    var type = "POST";

    if ($("#editBooking [name='vechicle_no'").val() == "") {
      toast("Please Enter all the details.");
      return false;
    }
    var r = confirm("Confirm Edit?");
    if (r == true) {
      $scope.isDisabled = true;

      if (online()) {
        $.ajax({
          url: url,
          type: type,
          data: data,
          success: function (data) {
            $scope.isDisabled = false;
            if (data == "Booking updated") {
              refresh();
              toast("Booking Updated.");
              $("#modal2").closeModal();
              $("#editBooking").each(function () {
                this.reset();
              });
            } else {
              toast(data);
            }
          }
        });
      } else {
        alert(
          "No Internet Connection. Please click the sync button once connected back to the internet."
        );

        if (get("toSync") == null || !isArray(get("toSync")))
          set("toSync", JSON.stringify([]));

        var toSync = get("toSync");
        toSync.push({
          url: url,
          data: data,
          type: type,
          pushedOn: new Date()
        });
        set("toSync", toSync);
      }
    }
  };

  $scope.addBooking = function () {
    var rnum =
      $("#vnum1").val() +
      $("#vnum2").val() +
      $("#vnum3").val() +
      $("#vnum4").val();
    rnum = rnum.toUpperCase();
    var reg = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
    if (!reg.test(rnum)) {
      toast("Please enter valid Registration Number");
      return;
    }
    if ($("#mobile").val().length < 10) {
      toast("Please enter valid Mobile Number");
      return;
    }

    var data = {
      mobile: $("[name='mobile'").val(),
      vechicle_no: rnum,
      term: $("input[name='term']:checked").val(),
      userId: $("[name='userId'").val(),
      via: $("[name='via'").val(),
      pid: $("[name='pid'").val(),
      btype: $("[name='btype'").val(),
      cid: get("user").cid
    };
    var url =
      apiEndpoint +
      ($("[name='btype']:checked").val() == 3 ? "addMBooking" : "addBooking");
    var type = "POST";
    if ($("[name='mobile'").val() == "") {
      toast("Please Enter all the details.");
      return false;
    }

    var r = confirm(
      "Phone No : " +
      $("[name='mobile'").val() +
      " \nRegistration No : " +
      rnum +
      " \nYou'll not be allowed to edit the details. Confirm Booking?"
    );
    if (r == true) {
      $scope.isDisabled = true;

      if (online()) {
        if ($("[name='btype']:checked").val() == "3") {
          data.getstatus = "cost";
          $.ajax({
            url: url,
            type: type,
            data: data,
            success: function (data) {
              $scope.isDisabled = false;
              $scope.$digest();
              if (data.status === 0) {
                toast(data.msg);
              } else {
                //toast(data);
                var d = confirm(
                  "Check In : " +
                  data.checkin_time +
                  " \nCheck In : " +
                  data["checkout_time"] +
                  " \nFinal Amount : " +
                  data["final_amt"] +
                  " \nConfirm Booking?"
                );
                if (d === true) {
                  $scope.isDisabled = true;
                  var data = {
                    mobile: $("[name='mobile'").val(),
                    vechicle_no: rnum,
                    term: $("input[name='term']:checked").val(),
                    userId: $("[name='userId'").val(),
                    via: $("[name='via'").val(),
                    pid: $("[name='pid'").val(),
                    btype: $("[name='btype'").val()
                  };
                  if (online()) {
                    $.ajax({
                      url: url,
                      type: type,
                      data: data,
                      success: function (result) {
                        $scope.isDisabled = false;
                        if (result === "Booking added") {
                          refresh();
                          toast("Booking Added.");
                          $("#modal1").closeModal();
                          $("#addBooking").each(function () {
                            this.reset();
                          });
                          $scope.rnum = "";
                        } else {
                          toast(result);
                        }
                      }
                    });
                  } else {
                    alert(
                      "No Internet Connection. Please click the sync button once connected back to the internet."
                    );
                    refresh();
                    $("#modal1").closeModal();
                    $("#addBooking").each(function () {
                      this.reset();
                    });
                    $scope.rnum = "";
                    if (get("toSync") == null || !isArray(get("toSync")))
                      set("toSync", JSON.stringify([]));

                    var toSync = get("toSync");
                    toSync.push({
                      url: url,
                      data: data,
                      type: type,
                      pushedOn: new Date(),
                      checkin_time: datetime
                    });
                    set("toSync", toSync);
                  }
                }
              }
            }
          });
        } else {
          var data = {
            mobile: $("[name='mobile'").val(),
            vechicle_no: rnum,
            term: $("input[name='term']:checked").val(),
            userId: $("[name='userId'").val(),
            via: $("[name='via'").val(),
            pid: $("[name='pid'").val(),
            btype: $("[name='btype'").val(),
            cid:  get("user").cid
          };
          $.ajax({
            url: url,
            type: type,
            data: data,
            success: function (data) {
              $scope.isDisabled = false;
              $scope.$digest();
              if (data == "Booking added") {
                refresh();
                toast("Booking Added.");
                $("#modal1").closeModal();
                $("#addBooking").each(function () {
                  this.reset();
                });
                $scope.rnum = "";
              } else {
                toast(data);
              }
            }
          });
        }
      } else {
        if (get("toSync") == null || !isArray(get("toSync")))
          set("toSync", JSON.stringify([]));
        var toSync = get("toSync");
        data["mode"] = "offline";
        data["checkin_time"] = datetime;
        toSync.push({
          url: url,
          data: data,
          type: type,
          pushedOn: new Date()
        });
        set("toSync", toSync);
        // alert(JSON.stringify($scope.bookings));
        alert(
          "No Internet Connection. Please click the sync button once connected back to the internet."
        );

        $("#modal1").closeModal();
        $("#addBooking").each(function () {
          this.reset();
        });
        $scope.rnum = "";
        $scope.isDisabled = false;
        // $scope.$digest();
        // refresh();
        var offlineData = [];
        for (var i = toSync.length - 1; i >= 0; i--) {
          offlineData.push(toSync[i].data);
        }
        $scope.bookings = offlineData.concat($scope.bookingData);
      }
    }
  };

  $scope.sync = function () {
    if (online()) {
      var toSync = get("toSync");
      var itemsProcessed = 0;
      if(toSync) {
        toSync.forEach(function (bookingData, index) {
          bookingData.data["mode"] = "offline";
          $.ajax({
            url: bookingData.url,
            type: bookingData.type,
            data: bookingData.data,
            success: function (result) {
              $scope.isDisabled = false;
              if (result === "Booking added") {
                toSync[index].isAdded = true;
                refresh();
                toast("Booking Added.");
                $("#modal1").closeModal();
                $("#addBooking").each(function () {
                  this.reset();
                });
                $scope.rnum = "";
              } else {
                toSync[index].isAdded = false;
                toast(result.msg);
              }
              itemsProcessed++;
              if (itemsProcessed === toSync.length) {
                toSync = toSync.filter(data => {
                  return data.isAdded == false;
                });
                set("toSync", toSync);
              }
            }
          });
  
        });
      }
    } else {
      alert(
        "Data cannot be synced as the device is not connected to the internet"
      );
    }
  };

  $scope.logout = function () {
    window.localStorage.removeItem("user");
    window.location.href = "login.html";
  };
  function getMonthlyBookingStatus() {
    $.ajax({
      url: apiEndpoint + "getMonthlyBookingStatus",
      type: "post",
      data: {
        userId: get("user").ID
      },
      success: function (data) {
        $scope.monthlyBookingData = data;
        $scope.checkMonthlyBooking(4);
      }
    });
  };
  $scope.checkMonthlyBooking = function (value) {
    if ($scope.monthlyBookingData.supervisiorM == 1) {
      if (value == 4 && $scope.monthlyBookingData.supervisiorMC == 1) {
        $scope.monthlyBooking = true;
        $scope.$applyAsync();
      } else if (value == 3 && $scope.monthlyBookingData.supervisiorMB == 1) {
        $scope.monthlyBooking = true;
        $scope.$applyAsync();
      } else {
        $scope.monthlyBooking = false;
      }
    }
  }
  $scope.getBookingDate = function (value) {
    var split = value.split(' ');
    return split[0];
  }
  $scope.editB = function (id) {
    $scope.bid = id;
    if (online()) {
      $.ajax({
        url: apiEndpoint + "editBooking",
        type: "get",
        data: {
          pid: get("user").parkingLot,
          id: id
        },
        success: function (data) {
          $("#modal2").openModal();
        }
      });
    } else {
      alert(
        "No Internet Connection. Please try again once connected back to the internet."
      );
    }
  };
});

function req(url, data, type) { }

$(document).ready(function () {
  $("input[name='search']").keyup(function (e) {
    var sterm = $(this).val();
    if (sterm == "") {
      $(".contact").show();
      $(".ftest1").click();
    } else {
      $(".contact").hide();
      $(".contact[data-booking-id='" + sterm + "']").show();
      $(
        ".f" +
        $(".contact[data-booking-id='" + sterm + "']")
          .parent()
          .parent()
          .parent()
          .parent()
          .attr("id")
      ).click();

      $(".contact[data-vehicle-number*='" + sterm + "' i]").show();
      $(
        ".f" +
        $(".contact[data-vehicle-number*='" + sterm + "' i]")
          .parent()
          .parent()
          .parent()
          .parent()
          .attr("id")
      ).click();
    }
  });
});

