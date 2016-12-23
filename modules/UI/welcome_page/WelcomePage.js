/* global $ */

function enterRoom() {
    const $enterRoomField = $("#enter_room_field");

    var val = $enterRoomField.val();
    if(!val) {
        val = $enterRoomField.data("room-name");
    }
    if (val) {
        window.location.pathname = "/" + val;
    }
}

function setupWelcomePage() {
    // XXX: We left only going to conference page here because transitions via
    // React Router isn't implemented yet.

    $("#enter_room_button").click(function() {
        enterRoom();
    });

    $("#enter_room_field").keydown(function (event) {
        if (event.keyCode === 13 /* enter */) {
            enterRoom();
        }
    });
}

module.exports = setupWelcomePage;
