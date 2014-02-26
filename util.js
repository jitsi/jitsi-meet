/**
 * Utility functions.
 */
var Util = (function (my) {

    /**
     * Returns the text width for the given element.
     *
     * @param el the element
     */
    my.getTextWidth = function(el) {
        return (el.clientWidth + 1);
    };

    /**
     * Returns the text height for the given element.
     *
     * @param el the element
     */
    my.getTextHeight = function(el) {
        return (el.clientHeight + 1);
    };

    /**
     * Casts the given number to integer.
     *
     * @param number the number to cast
     */
    my.toInteger = function(number) {
        return Math.round(Number(number));
    };

    /**
     * Plays the sound given by id.
     *
     * @param id the identifier of the audio element.
     */
    my.playSoundNotification = function(id) {
        document.getElementById(id).play();
    };

    /**
     * Escapes the given text.
     */
    my.escapeHtml = function(unsafeText) {
        return $('<div/>').text(unsafeText).html();
    };

    /**
     * Indicates if the given string is an alphanumeric string.
     * Note that some special characters are also allowed (-, _ , /) for the
     * purpose of checking URIs. (FIXME: This should maybe moved to another not
     * so generic method in the future.)
     */
    my.isAlphanumeric = function(unsafeText) {
        var regex = /^[a-z0-9-_\/]+$/i;
        return regex.test(unsafeText);
    };

    return my;
}(Util || {}));