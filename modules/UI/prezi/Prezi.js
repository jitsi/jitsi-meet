var ToolbarToggler = require("../toolbars/ToolbarToggler");
var UIUtil = require("../util/UIUtil");
var VideoLayout = require("../videolayout/VideoLayout");
var messageHandler = require("../util/MessageHandler");
var PreziPlayer = require("./PreziPlayer");

var preziPlayer = null;

var Prezi = {


    /**
     * Reloads the current presentation.
     */
    reloadPresentation: function() {
        var iframe = document.getElementById(preziPlayer.options.preziId);
        iframe.src = iframe.src;
    },

    /**
     * Returns <tt>true</tt> if the presentation is visible, <tt>false</tt> -
     * otherwise.
     */
    isPresentationVisible: function () {
        return ($('#presentation>iframe') != null
                && $('#presentation>iframe').css('opacity') == 1);
    },

    /**
     * Opens the Prezi dialog, from which the user could choose a presentation
     * to load.
     */
    openPreziDialog: function() {
        var myprezi = APP.xmpp.getPrezi();
        if (myprezi) {
            messageHandler.openTwoButtonDialog("dialog.removePreziTitle",
                null,
                "dialog.removePreziMsg",
                null,
                false,
                "dialog.Remove",
                function(e,v,m,f) {
                    if(v) {
                        APP.xmpp.removePreziFromPresence();
                    }
                }
            );
        }
        else if (preziPlayer != null) {
            messageHandler.openTwoButtonDialog("dialog.sharePreziTitle",
                null, "dialog.sharePreziMsg",
                null,
                false,
                "dialog.Ok",
                function(e,v,m,f) {
                    $.prompt.close();
                }
            );
        }
        else {
            var html = APP.translation.generateTranslatonHTML(
                "dialog.sharePreziTitle");
            var cancelButton = APP.translation.generateTranslatonHTML(
                "dialog.Cancel");
            var shareButton = APP.translation.generateTranslatonHTML(
                "dialog.Share");
            var backButton = APP.translation.generateTranslatonHTML(
                "dialog.Back");
            var buttons = [];
            var buttons1 = [];
            // Cancel button to both states
            buttons.push({title: cancelButton, value: false});
            buttons1.push({title: cancelButton, value: false});
            // Share button
            buttons.push({title: shareButton, value: true});
            // Back button
            buttons1.push({title: backButton, value: true});
            var linkError = APP.translation.generateTranslatonHTML(
                "dialog.preziLinkError");
            var defaultUrl = APP.translation.translateString("defaultPreziLink",
                {url: "http://prezi.com/wz7vhjycl7e6/my-prezi"});
            var openPreziState = {
                state0: {
                    html:   '<h2>' + html + '</h2>' +
                            '<input name="preziUrl" type="text" ' +
                            'data-i18n="[placeholder]defaultPreziLink" data-i18n-options=\'' +
                            JSON.stringify({"url": "http://prezi.com/wz7vhjycl7e6/my-prezi"}) +
                            '\' placeholder="' + defaultUrl + '" autofocus>',
                    persistent: false,
                    buttons: buttons,
                    focus: ':input:first',
                    defaultButton: 0,
                    submit: function (e, v, m, f) {
                        e.preventDefault();
                        if(v)
                        {
                            var preziUrl = f.preziUrl;

                            if (preziUrl)
                            {
                                var urlValue
                                    = encodeURI(UIUtil.escapeHtml(preziUrl));

                                if (urlValue.indexOf('http://prezi.com/') != 0
                                    && urlValue.indexOf('https://prezi.com/') != 0)
                                {
                                    $.prompt.goToState('state1');
                                    return false;
                                }
                                else {
                                    var presIdTmp = urlValue.substring(
                                            urlValue.indexOf("prezi.com/") + 10);
                                    if (!isAlphanumeric(presIdTmp)
                                            || presIdTmp.indexOf('/') < 2) {
                                        $.prompt.goToState('state1');
                                        return false;
                                    }
                                    else {
                                        APP.xmpp.addToPresence("prezi", urlValue);
                                        $.prompt.close();
                                    }
                                }
                            }
                        }
                        else
                            $.prompt.close();
                    }
                },
                state1: {
                    html:   '<h2>' + html + '</h2>' +
                            linkError,
                    persistent: false,
                    buttons: buttons1,
                    focus: ':input:first',
                    defaultButton: 1,
                    submit: function (e, v, m, f) {
                        e.preventDefault();
                        if (v === 0)
                            $.prompt.close();
                        else
                            $.prompt.goToState('state0');
                    }
                }
            };
            messageHandler.openDialogWithStates(openPreziState);
        }
    }

};

/**
 * A new presentation has been added.
 *
 * @param event the event indicating the add of a presentation
 * @param jid the jid from which the presentation was added
 * @param presUrl url of the presentation
 * @param currentSlide the current slide to which we should move
 */
function presentationAdded(event, jid, presUrl, currentSlide) {
    console.log("presentation added", presUrl);

    var presId = getPresentationId(presUrl);

    var elementId = 'participant_'
        + Strophe.getResourceFromJid(jid)
        + '_' + presId;

    // We explicitly don't specify the peer jid here, because we don't want
    // this video to be dealt with as a peer related one (for example we
    // don't want to show a mute/kick menu for this one, etc.).
    VideoLayout.addRemoteVideoContainer(null, elementId);
    VideoLayout.resizeThumbnails();

    var controlsEnabled = false;
    if (jid === APP.xmpp.myJid())
        controlsEnabled = true;

    setPresentationVisible(true);
    $('#largeVideoContainer').hover(
        function (event) {
            if (Prezi.isPresentationVisible()) {
                var reloadButtonRight = window.innerWidth
                    - $('#presentation>iframe').offset().left
                    - $('#presentation>iframe').width();

                $('#reloadPresentation').css({  right: reloadButtonRight,
                    display:'inline-block'});
            }
        },
        function (event) {
            if (!Prezi.isPresentationVisible())
                $('#reloadPresentation').css({display:'none'});
            else {
                var e = event.toElement || event.relatedTarget;

                if (e && e.id != 'reloadPresentation' && e.id != 'header')
                    $('#reloadPresentation').css({display:'none'});
            }
        });

    preziPlayer = new PreziPlayer(
        'presentation',
        {preziId: presId,
            width: getPresentationWidth(),
            height: getPresentationHeihgt(),
            controls: controlsEnabled,
            debug: true
        });

    $('#presentation>iframe').attr('id', preziPlayer.options.preziId);

    preziPlayer.on(PreziPlayer.EVENT_STATUS, function(event) {
        console.log("prezi status", event.value);
        if (event.value == PreziPlayer.STATUS_CONTENT_READY) {
            if (jid != APP.xmpp.myJid())
                preziPlayer.flyToStep(currentSlide);
        }
    });

    preziPlayer.on(PreziPlayer.EVENT_CURRENT_STEP, function(event) {
        console.log("event value", event.value);
        APP.xmpp.addToPresence("preziSlide", event.value);
    });

    $("#" + elementId).css( 'background-image',
        'url(../images/avatarprezi.png)');
    $("#" + elementId).click(
        function () {
            setPresentationVisible(true);
        }
    );
};

/**
 * A presentation has been removed.
 *
 * @param event the event indicating the remove of a presentation
 * @param jid the jid for which the presentation was removed
 * @param the url of the presentation
 */
function presentationRemoved(event, jid, presUrl) {
    console.log('presentation removed', presUrl);
    var presId = getPresentationId(presUrl);
    setPresentationVisible(false);
    $('#participant_'
        + Strophe.getResourceFromJid(jid)
        + '_' + presId).remove();
    $('#presentation>iframe').remove();
    if (preziPlayer != null) {
        preziPlayer.destroy();
        preziPlayer = null;
    }
};

/**
 * Indicates if the given string is an alphanumeric string.
 * Note that some special characters are also allowed (-, _ , /, &, ?, =, ;) for the
 * purpose of checking URIs.
 */
function isAlphanumeric(unsafeText) {
    var regex = /^[a-z0-9-_\/&\?=;]+$/i;
    return regex.test(unsafeText);
}

/**
 * Returns the presentation id from the given url.
 */
function getPresentationId (presUrl) {
    var presIdTmp = presUrl.substring(presUrl.indexOf("prezi.com/") + 10);
    return presIdTmp.substring(0, presIdTmp.indexOf('/'));
}

/**
 * Returns the presentation width.
 */
function getPresentationWidth() {
    var availableWidth = UIUtil.getAvailableVideoWidth();
    var availableHeight = getPresentationHeihgt();

    var aspectRatio = 16.0 / 9.0;
    if (availableHeight < availableWidth / aspectRatio) {
        availableWidth = Math.floor(availableHeight * aspectRatio);
    }
    return availableWidth;
}

/**
 * Returns the presentation height.
 */
function getPresentationHeihgt() {
    var remoteVideos = $('#remoteVideos');
    return window.innerHeight - remoteVideos.outerHeight();
}

/**
 * Resizes the presentation iframe.
 */
function resize() {
    if ($('#presentation>iframe')) {
        $('#presentation>iframe').width(getPresentationWidth());
        $('#presentation>iframe').height(getPresentationHeihgt());
    }
}

/**
 * Shows/hides a presentation.
 */
function setPresentationVisible(visible) {
    var prezi = $('#presentation>iframe');
    if (visible) {
        // Trigger the video.selected event to indicate a change in the
        // large video.
        $(document).trigger("video.selected", [true]);

        $('#largeVideo').fadeOut(300);
        prezi.fadeIn(300, function() {
            prezi.css({opacity:'1'});
            ToolbarToggler.dockToolbar(true);
            VideoLayout.setLargeVideoVisible(false);
        });
        $('#activeSpeaker').css('visibility', 'hidden');
    }
    else {
        if (prezi.css('opacity') == '1') {
            prezi.fadeOut(300, function () {
                prezi.css({opacity:'0'});
                $('#reloadPresentation').css({display:'none'});
                $('#largeVideo').fadeIn(300, function() {
                    VideoLayout.setLargeVideoVisible(true);
                    ToolbarToggler.dockToolbar(false);
                });
            });
        }
    }
}

/**
 * Presentation has been removed.
 */
$(document).bind('presentationremoved.muc', presentationRemoved);

/**
 * Presentation has been added.
 */
$(document).bind('presentationadded.muc', presentationAdded);

/*
 * Indicates presentation slide change.
 */
$(document).bind('gotoslide.muc', function (event, jid, presUrl, current) {
    if (preziPlayer && preziPlayer.getCurrentStep() != current) {
        preziPlayer.flyToStep(current);

        var animationStepsArray = preziPlayer.getAnimationCountOnSteps();
        for (var i = 0; i < parseInt(animationStepsArray[current]); i++) {
            preziPlayer.flyToStep(current, i);
        }
    }
});

/**
 * On video selected event.
 */
$(document).bind('video.selected', function (event, isPresentation) {
    if (!isPresentation && $('#presentation>iframe')) {
        setPresentationVisible(false);
    }
});

$(window).resize(function () {
    resize();
});

module.exports = Prezi;
