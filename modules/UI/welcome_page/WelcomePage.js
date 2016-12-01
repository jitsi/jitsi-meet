/* global $ */

function enter_room() {
    var val = $("#enter_room_field").val();
    if(!val) {
        val = $("#enter_room_field").data("room-name");
    }
    if (val) {
        window.location.pathname = "/" + val;
    }
}

function setupWelcomePage() {
    /*
    * XXX: We left only going to conference page here because transitions via
    * React Router isn't implemented yet.
    */

    $("#enter_room_button").click(function() {
        enter_room();
    });

    $("#enter_room_field").keydown(function (event) {
        if (event.keyCode === 13 /* enter */) {
            enter_room();
        }
    });
}

module.exports = setupWelcomePage;
