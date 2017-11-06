var domain = "http://occupyparking.boxcommerce.in/";
var apiEndpoint = "http://occupyparking.boxcommerce.in/api/?method=";

$(document).ready(function () {

    $("#chkLogin").click(function (e) {
        e.preventDefault();

        $.ajax({
            url: apiEndpoint + "supervisorLogin",
            type: "POST",
            data: $("form").serialize(),
            success: function (data) {
                if (data.error) {
                    toast(data.error);
                } else if (data.ID) {
                    set('user', data);
                    redirect("index.html");
                } else {
                    toast("Oops ... Looks like something went wrong");
                }
            }
        });

    });
});


function maxLengthCheck(object)
{
    if (object.value.length > 10) {
        object.value = object.value.slice(0, 10);
    }
}



function toast(msg) {

    try {
        window.plugins.toast.show(msg, 'short', 'center', function (a) {
            console.log('toast success: ' + a)
        }, function (b) {
            alert('toast error: ' + b)
        })

    } catch (err) {
        alert(msg);
    }

}

function redirect(url) {
    window.location.href = url;
}

function online() {
    return window.navigator.onLine;
}

function set(key, val) {
    if (isArray(val) || isObject(val))
        val = JSON.stringify(val);
    return window.localStorage.setItem(key, val);
}

function get(key) {
    var val = window.localStorage.getItem(key);

    return (isJson(val) ? JSON.parse(val) : val);

}

function isArray(a) {
    return (!!a) && (a.constructor === Array);
}

function isObject(a) {
    return (!!a) && (a.constructor === Object);
}

function isJson(item) {
    item = typeof item !== "string"
            ? JSON.stringify(item)
            : item;

    try {
        item = JSON.parse(item);
    } catch (e) {
        return false;
    }

    if (typeof item === "object" && item !== null) {
        return true;
    }

    return false;
}

function footerAlign() {
    $('footer').css('display', 'block');
    $('footer').css('height', 'auto');
    var footerHeight = $('footer').outerHeight();
    $('body').css('padding-bottom', footerHeight);
    $('footer').css('height', footerHeight);
}


$(document).ready(function () {
    footerAlign();
});

$(window).resize(function () {
    footerAlign();
});

$( document ).ajaxError(function() {
 toast("Oops ... looks like something went wrong");
});