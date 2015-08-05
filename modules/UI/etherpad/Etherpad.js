/* global $, config,
   setLargeVideoVisible, Util */

var VideoLayout = require("../videolayout/VideoLayout");
var Prezi = require("../prezi/Prezi");
var UIUtil = require("../util/UIUtil");

var etherpadName = null;
var etherpadIFrame = null;
var domain = null;
var options = "?showControls=true&showChat=false&showLineNumbers=true&useMonospaceFont=false";


/**
 * Resizes the etherpad.
 */
function resize() {
    if ($('#etherpad>iframe').length) {
        var remoteVideos = $('#remoteVideos');
        var availableHeight
            = window.innerHeight - remoteVideos.outerHeight();
        var availableWidth = UIUtil.getAvailableVideoWidth();

        $('#etherpad>iframe').width(availableWidth);
        $('#etherpad>iframe').height(availableHeight);
    }
}

/**
 * Creates the Etherpad button and adds it to the toolbar.
 */
function enableEtherpadButton() {
    if (!$('#toolbar_button_etherpad').is(":visible"))
        $('#toolbar_button_etherpad').css({display: 'inline-block'});
}

/**
 * Creates the IFrame for the etherpad.
 */
function createIFrame() {
    etherpadIFrame = VideoLayout.createEtherpadIframe(
            domain + etherpadName + options, function() {

                document.domain = document.domain;
                bubbleIframeMouseMove(etherpadIFrame);
                setTimeout(function() {
                    // the iframes inside of the etherpad are
                    // not yet loaded when the etherpad iframe is loaded
                    var outer = etherpadIFrame.
                        contentDocument.getElementsByName("ace_outer")[0];
                    bubbleIframeMouseMove(outer);
                    var inner = outer.
                        contentDocument.getElementsByName("ace_inner")[0];
                    bubbleIframeMouseMove(inner);
                }, 2000);
            });
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


var Etherpad = {
    /**
     * Initializes the etherpad.
     */
    init: function (name) {

        if (config.etherpad_base && !etherpadName && name) {

            domain = config.etherpad_base;

            etherpadName = name;

            enableEtherpadButton();

            /**
             * Resizes the etherpad, when the window is resized.
             */
            $(window).resize(function () {
                resize();
            });
        }
    },

    /**
     * Opens/hides the Etherpad.
     */
    toggleEtherpad: function (isPresentation) {
        if (!etherpadIFrame)
            createIFrame();


        if(VideoLayout.getLargeVideoState() === "etherpad")
        {
            VideoLayout.setLargeVideoState("video");
        }
        else
        {
            VideoLayout.setLargeVideoState("etherpad");
        }
        resize();
    }
};

module.exports = Etherpad;
