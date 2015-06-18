var animateTimeout, updateTimeout;

var RoomNameGenerator = require("./RoomnameGenerator");

function enter_room()
{
    var val = $("#enter_room_field").val();
    if(!val) {
        val = $("#enter_room_field").attr("room_name");
    }
    if (val) {
        window.location.pathname = "/" + val;
    }
}

function animate(word) {
    var currentVal = $("#enter_room_field").attr("placeholder");
    $("#enter_room_field").attr("placeholder", currentVal + word.substr(0, 1));
    animateTimeout = setTimeout(function() {
        animate(word.substring(1, word.length))
    }, 70);
}

function update_roomname()
{
    var word = RoomNameGenerator.generateRoomWithoutSeparator();
    $("#enter_room_field").attr("room_name", word);
    $("#enter_room_field").attr("placeholder", "");
    clearTimeout(animateTimeout);
    animate(word);
    updateTimeout = setTimeout(update_roomname, 10000);
}


function setupWelcomePage()
{
    $("#videoconference_page").hide();
    $("#domain_name").text(
            window.location.protocol + "//" + window.location.host + "/");
    if (interfaceConfig.SHOW_JITSI_WATERMARK) {
        var leftWatermarkDiv
            = $("#welcome_page_header div[class='watermark leftwatermark']");
        if(leftWatermarkDiv && leftWatermarkDiv.length > 0)
        {
            leftWatermarkDiv.css({display: 'block'});
            leftWatermarkDiv.parent().get(0).href
                = interfaceConfig.JITSI_WATERMARK_LINK;
        }

    }

    if (interfaceConfig.SHOW_BRAND_WATERMARK) {
        var rightWatermarkDiv
            = $("#welcome_page_header div[class='watermark rightwatermark']");
        if(rightWatermarkDiv && rightWatermarkDiv.length > 0) {
            rightWatermarkDiv.css({display: 'block'});
            rightWatermarkDiv.parent().get(0).href
                = interfaceConfig.BRAND_WATERMARK_LINK;
            rightWatermarkDiv.get(0).style.backgroundImage
                = "url(images/rightwatermark.png)";
        }
    }

    if (interfaceConfig.SHOW_POWERED_BY) {
        $("#welcome_page_header>a[class='poweredby']")
            .css({display: 'block'});
    }

    $("#enter_room_button").click(function()
    {
        enter_room();
    });

    $("#enter_room_field").keydown(function (event) {
        if (event.keyCode === 13 /* enter */) {
            enter_room();
        }
    });

    if (!(interfaceConfig.GENERATE_ROOMNAMES_ON_WELCOME_PAGE === false)){
        var updateTimeout;
        var animateTimeout;
        $("#reload_roomname").click(function () {
            clearTimeout(updateTimeout);
            clearTimeout(animateTimeout);
            update_roomname();
        });
        $("#reload_roomname").show();


        update_roomname();
    }

    $("#disable_welcome").click(function () {
        window.localStorage.welcomePageDisabled
            = $("#disable_welcome").is(":checked");
    });

}

module.exports = setupWelcomePage;