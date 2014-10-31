var BottomToolbar = (function (my) {
    my.toggleChat = function() {
        PanelToggler.toggleChat();
    };

    my.toggleContactList = function() {
        PanelToggler.toggleContactList();
    };

    my.toggleFilmStrip = function() {
        var filmstrip = $("#remoteVideos");
        filmstrip.toggleClass("hidden");
    };

    $(document).bind("remotevideo.resized", function (event, width, height) {
        var bottom = (height - $('#bottomToolbar').outerHeight())/2 + 18;

        $('#bottomToolbar').css({bottom: bottom + 'px'});
    });

    return my;
}(BottomToolbar || {}));
