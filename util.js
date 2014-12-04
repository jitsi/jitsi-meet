/* global $ */
/**
 * Utility functions.
 */
var Util = (function (my) {

    /**
     * Returns the text width for the given element.
     *
     * @param el the element
     */
    my.getTextWidth = function (el) {
        return (el.clientWidth + 1);
    };

    /**
     * Returns the text height for the given element.
     *
     * @param el the element
     */
    my.getTextHeight = function (el) {
        return (el.clientHeight + 1);
    };

    /**
     * Casts the given number to integer.
     *
     * @param number the number to cast
     */
    my.toInteger = function (number) {
        return Math.round(Number(number));
    };

    /**
     * Plays the sound given by id.
     *
     * @param id the identifier of the audio element.
     */
    my.playSoundNotification = function (id) {
        document.getElementById(id).play();
    };

    /**
     * Escapes the given text.
     */
    my.escapeHtml = function (unsafeText) {
        return $('<div/>').text(unsafeText).html();
    };

    /**
     * Returns the available video width.
     */
    my.getAvailableVideoWidth = function () {
        var rightPanelWidth
            = PanelToggler.isVisible() ? PanelToggler.getPanelSize()[0] : 0;

        return window.innerWidth - rightPanelWidth;
    };

    my.imageToGrayScale = function (canvas) {
        var context = canvas.getContext('2d');
        var imgData = context.getImageData(0, 0, canvas.width, canvas.height);
        var pixels  = imgData.data;

        for (var i = 0, n = pixels.length; i < n; i += 4) {
            var grayscale
                = pixels[i] * .3 + pixels[i+1] * .59 + pixels[i+2] * .11;
            pixels[i  ] = grayscale;        // red
            pixels[i+1] = grayscale;        // green
            pixels[i+2] = grayscale;        // blue
            // pixels[i+3]              is alpha
        }
        // redraw the image in black & white
        context.putImageData(imgData, 0, 0);
    };

    my.setTooltip = function (element, tooltipText, position) {
        element.setAttribute("data-content", tooltipText);
        element.setAttribute("data-toggle", "popover");
        element.setAttribute("data-placement", position);
        element.setAttribute("data-html", true);
        element.setAttribute("data-container", "body");
    };

    my.createExpBackoffTimer = function (step) {
        var count = 1;
        return function (reset) {
            // Reset call
            if (reset) {
                count = 1;
                return;
            }
            // Calculate next timeout
            var timeout = Math.pow(2, count - 1);
            count += 1;
            return timeout * step;
        };
    };

    return my;
}(Util || {}));
