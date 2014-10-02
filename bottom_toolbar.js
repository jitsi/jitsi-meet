var BottomToolbar = (function (my) {
    my.toggleChat = function() {
        if (ContactList.isVisible()) {
            buttonClick("#contactListButton", "active");
            $('#contactlist').css('z-index', 4);
            setTimeout(function() {
                $('#contactlist').css('display', 'none');
                $('#contactlist').css('z-index', 5);
            }, 500);
        }

        Chat.toggleChat();

        buttonClick("#chatBottomButton", "active");
    };

    my.toggleContactList = function() {
        if (Chat.isVisible()) {
            buttonClick("#chatBottomButton", "active");
            setTimeout(function() {
                $('#chatspace').css('display', 'none');
            }, 500);
        }

        buttonClick("#contactListButton", "active");

        ContactList.toggleContactList();
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
