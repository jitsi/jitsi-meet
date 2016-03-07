/* global APP, config, $, interfaceConfig */

import UIUtil from '../util/UIUtil';
import BottomToolbar from './BottomToolbar';
import FilmStrip from '../videolayout/FilmStrip.js';

let toolbarTimeoutObject;
let toolbarTimeout = interfaceConfig.INITIAL_TOOLBAR_TIMEOUT;

function showDesktopSharingButton() {
    if (APP.conference.isDesktopSharingEnabled &&
        UIUtil.isButtonEnabled('desktop')) {
        $('#toolbar_button_desktopsharing').css({display: "inline-block"});
    } else {
        $('#toolbar_button_desktopsharing').css({display: "none"});
    }
}

function isToolbarVisible () {
    return $('#header').is(':visible');
}

/**
 * Hides the toolbar.
 */
function hideToolbar() {
    if (config.alwaysVisibleToolbar) {
        return;
    }

    let header = $("#header");
    let isToolbarHover = false;
    header.find('*').each(function () {
        let id = $(this).attr('id');
        if ($(`#${id}:hover`).length > 0) {
            isToolbarHover = true;
        }
    });
    if ($("#bottomToolbar:hover").length > 0) {
        isToolbarHover = true;
    }

    clearTimeout(toolbarTimeoutObject);
    toolbarTimeoutObject = null;

    if (isToolbarHover) {
        toolbarTimeoutObject = setTimeout(hideToolbar, toolbarTimeout);
    } else {
        header.hide("slide", { direction: "up", duration: 300});
        $('#subject').animate({top: "-=40"}, 300);
        if (!FilmStrip.isFilmStripVisible()) {
            BottomToolbar.hide(true);
        }
    }
}

const ToolbarToggler = {
    /**
     * Shows the main toolbar.
     */
    showToolbar () {
        if (interfaceConfig.filmStripOnly) {
            return;
        }
        let header = $("#header");
        if (!header.is(':visible') || !BottomToolbar.isVisible()) {
            header.show("slide", { direction: "up", duration: 300});
            $('#subject').animate({top: "+=40"}, 300);
            if (!BottomToolbar.isVisible()) {
                BottomToolbar.show(true);
            }

            if (toolbarTimeoutObject) {
                clearTimeout(toolbarTimeoutObject);
                toolbarTimeoutObject = null;
            }
            toolbarTimeoutObject = setTimeout(hideToolbar, toolbarTimeout);
            toolbarTimeout = interfaceConfig.TOOLBAR_TIMEOUT;
        }

        // Show/hide desktop sharing button
        showDesktopSharingButton();
    },

    /**
     * Docks/undocks the toolbar.
     *
     * @param isDock indicates what operation to perform
     */
    dockToolbar (isDock) {
        if (interfaceConfig.filmStripOnly) {
            return;
        }

        if (isDock) {
            // First make sure the toolbar is shown.
            if (!isToolbarVisible()) {
                this.showToolbar();
            }

            // Then clear the time out, to dock the toolbar.
            clearTimeout(toolbarTimeoutObject);
            toolbarTimeoutObject = null;
        } else {
            if (isToolbarVisible()) {
                toolbarTimeoutObject = setTimeout(hideToolbar, toolbarTimeout);
            } else {
                this.showToolbar();
            }
        }
    }
};

module.exports = ToolbarToggler;
