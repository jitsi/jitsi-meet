/* global $, config, connection, dockToolbar, Moderator, Prezi,
   setLargeVideoVisible, ToolbarToggler, Util, VideoLayout */
var Etherpad = (function (my) {
    var etherpadName = null;
    var etherpadIFrame = null;
    var domain = null;
    var options = "?showControls=true&showChat=false&showLineNumbers=true&useMonospaceFont=false";

    /**
     * Initializes the etherpad.
     */
    my.init = function (name) {

        if (config.etherpad_base && !etherpadName) {

            domain = config.etherpad_base;

            if (!name) {
                // In case we're the focus we generate the name.
                etherpadName = Math.random().toString(36).substring(7) +
                                '_' + (new Date().getTime()).toString();
                shareEtherpad();
            }
            else
                etherpadName = name;

            enableEtherpadButton();
        }
    };

    /**
     * Opens/hides the Etherpad.
     */
    my.toggleEtherpad = function (isPresentation) {
        if (!etherpadIFrame)
            createIFrame();

        var largeVideo = null;
        if (Prezi.isPresentationVisible())
            largeVideo = $('#presentation>iframe');
        else
            largeVideo = $('#largeVideo');

        if ($('#etherpad>iframe').css('visibility') === 'hidden') {
            $('#activeSpeaker').css('visibility', 'hidden');
            largeVideo.fadeOut(300, function () {
                if (Prezi.isPresentationVisible()) {
                    largeVideo.css({opacity: '0'});
                } else {
                    VideoLayout.setLargeVideoVisible(false);
                }
            });

            $('#etherpad>iframe').fadeIn(300, function () {
                document.body.style.background = '#eeeeee';
                $('#etherpad>iframe').css({visibility: 'visible'});
                $('#etherpad').css({zIndex: 2});
            });
        }
        else if ($('#etherpad>iframe')) {
            $('#etherpad>iframe').fadeOut(300, function () {
                $('#etherpad>iframe').css({visibility: 'hidden'});
                $('#etherpad').css({zIndex: 0});
                document.body.style.background = 'black';
            });

            if (!isPresentation) {
                $('#largeVideo').fadeIn(300, function () {
                    VideoLayout.setLargeVideoVisible(true);
                });
            }
        }
        resize();
    };

    my.isVisible = function() {
        var etherpadIframe = $('#etherpad>iframe');
        return etherpadIframe && etherpadIframe.is(':visible');
    };

    /**
     * Resizes the etherpad.
     */
    function resize() {
        if ($('#etherpad>iframe').length) {
            var remoteVideos = $('#remoteVideos');
            var availableHeight
                = window.innerHeight - remoteVideos.outerHeight();
            var availableWidth = Util.getAvailableVideoWidth();

            $('#etherpad>iframe').width(availableWidth);
            $('#etherpad>iframe').height(availableHeight);
        }
    }

    /**
     * Shares the Etherpad name with other participants.
     */
    function shareEtherpad() {
        connection.emuc.addEtherpadToPresence(etherpadName);
        connection.emuc.sendPresence();
    }

    /**
     * Creates the Etherpad button and adds it to the toolbar.
     */
    function enableEtherpadButton() {
        if (!$('#etherpadButton').is(":visible"))
            $('#etherpadButton').css({display: 'inline-block'});
    }

    /**
     * Creates the IFrame for the etherpad.
     */
    function createIFrame() {
        etherpadIFrame = document.createElement('iframe');
        etherpadIFrame.src = domain + etherpadName + options;
        etherpadIFrame.frameBorder = 0;
        etherpadIFrame.scrolling = "no";
        etherpadIFrame.width = $('#largeVideoContainer').width() || 640;
        etherpadIFrame.height = $('#largeVideoContainer').height() || 480;
        etherpadIFrame.setAttribute('style', 'visibility: hidden;');

        document.getElementById('etherpad').appendChild(etherpadIFrame);

        etherpadIFrame.onload = function() {

            document.domain = document.domain;
            bubbleIframeMouseMove(etherpadIFrame);
            setTimeout(function() {
            //the iframes inside of the etherpad are not yet loaded when the etherpad iframe is loaded
                var outer = etherpadIFrame.contentDocument.getElementsByName("ace_outer")[0];
                bubbleIframeMouseMove(outer);
                var inner = outer.contentDocument.getElementsByName("ace_inner")[0];
                bubbleIframeMouseMove(inner);
            }, 2000);
        };
    }

    function bubbleIframeMouseMove(iframe){
        var existingOnMouseMove = iframe.contentWindow.onmousemove;
        iframe.contentWindow.onmousemove = function(e){
            if(existingOnMouseMove) existingOnMouseMove(e);
            var evt = document.createEvent("MouseEvents");
            var boundingClientRect = iframe.getBoundingClientRect();
            evt.initMouseEvent(
                "mousemove",
                true, // bubbles
                false, // not cancelable
                window,
                e.detail,
                e.screenX,
                e.screenY,
                    e.clientX + boundingClientRect.left,
                    e.clientY + boundingClientRect.top,
                e.ctrlKey,
                e.altKey,
                e.shiftKey,
                e.metaKey,
                e.button,
                null // no related element
            );
            iframe.dispatchEvent(evt);
        };
    }

    /**
     * On Etherpad added to muc.
     */
    $(document).bind('etherpadadded.muc', function (event, jid, etherpadName) {
        console.log("Etherpad added", etherpadName);
        if (config.etherpad_base && !Moderator.isModerator()) {
            Etherpad.init(etherpadName);
        }
    });

    /**
     * On focus changed event.
     */
    // FIXME: there is no such event as 'focusechanged.muc'
    $(document).bind('focusechanged.muc', function (event, focus) {
        console.log("Focus changed");
        if (config.etherpad_base)
            shareEtherpad();
    });

    /**
     * On video selected event.
     */
    $(document).bind('video.selected', function (event, isPresentation) {
        if (!config.etherpad_base)
            return;

        if (etherpadIFrame && etherpadIFrame.style.visibility !== 'hidden')
            Etherpad.toggleEtherpad(isPresentation);
    });

    /**
     * Resizes the etherpad, when the window is resized.
     */
    $(window).resize(function () {
        resize();
    });

    return my;
}(Etherpad || {}));
