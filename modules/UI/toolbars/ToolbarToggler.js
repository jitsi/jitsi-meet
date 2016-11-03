/* global APP, config, $, interfaceConfig */

import UIUtil from '../util/UIUtil';
import Toolbar from './Toolbar';
import SideContainerToggler from "../side_pannels/SideContainerToggler";

let toolbarTimeoutObject;
let toolbarTimeout = interfaceConfig.INITIAL_TOOLBAR_TIMEOUT;
/**
 * If true the toolbar will be always displayed
 */
let alwaysVisibleToolbar = false;

function showDesktopSharingButton() {
    if (APP.conference.isDesktopSharingEnabled &&
        UIUtil.isButtonEnabled('desktop')) {
        $('#toolbar_button_desktopsharing').css({display: "inline-block"});
    } else {
        $('#toolbar_button_desktopsharing').css({display: "none"});
    }
}

/**
 * Hides the toolbar.
 *
 * @param force {true} to force the hiding of the toolbar without caring about
 * the extended toolbar side panels.
 */
function hideToolbar(force) { // eslint-disable-line no-unused-vars
    if (alwaysVisibleToolbar) {
        return;
    }

    clearTimeout(toolbarTimeoutObject);
    toolbarTimeoutObject = null;

    if (force !== true &&
            (Toolbar.isHovered()
                || APP.UI.isRingOverlayVisible()
                || SideContainerToggler.isVisible())) {
        toolbarTimeoutObject = setTimeout(hideToolbar, toolbarTimeout);
    } else {
        Toolbar.hide();
        $('#subject').animate({top: "-=40"}, 300);
    }
}

const ToolbarToggler = {
    /**
     * Initializes the ToolbarToggler
     */
    init() {
        alwaysVisibleToolbar = (config.alwaysVisibleToolbar === true);

        // disabled
        //this._registerWindowClickListeners();
    },

    /**
     * Registers click listeners handling the show and hode of toolbars when
     * user clicks outside of toolbar area.
     */
    _registerWindowClickListeners() {
        $(window).click(function() {
            (Toolbar.isEnabled() && Toolbar.isVisible())
                ? hideToolbar(true)
                : this.showToolbar();
        }.bind(this));

        Toolbar.registerClickListeners(function(event){
            event.stopPropagation();
        });
    },

    /**
     * Sets the value of alwaysVisibleToolbar variable.
     * @param value {boolean} the new value of alwaysVisibleToolbar variable
     */
    setAlwaysVisibleToolbar(value) {
        alwaysVisibleToolbar = value;
    },

    /**
     * Resets the value of alwaysVisibleToolbar variable to the default one.
     */
    resetAlwaysVisibleToolbar() {
        alwaysVisibleToolbar = (config.alwaysVisibleToolbar === true);
    },

    /**
     * Shows the main toolbar.
     * @param timeout (optional) to specify custom timeout value
     */
    showToolbar (timeout) {
        if (interfaceConfig.filmStripOnly) {
            return;
        }

        var updateTimeout = false;
        if (Toolbar.isEnabled() && !Toolbar.isVisible()) {
            Toolbar.show();
            $('#subject').animate({top: "+=40"}, 300);
            updateTimeout = true;
        }

        if (updateTimeout) {
            if (toolbarTimeoutObject) {
                clearTimeout(toolbarTimeoutObject);
                toolbarTimeoutObject = null;
            }
            toolbarTimeoutObject
                = setTimeout(hideToolbar, timeout || toolbarTimeout);
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
        if (interfaceConfig.filmStripOnly || !Toolbar.isEnabled()) {
            return;
        }

        if (isDock) {
            // First make sure the toolbar is shown.
            if (!Toolbar.isVisible()) {
                this.showToolbar();
            }

            // Then clear the time out, to dock the toolbar.
            clearTimeout(toolbarTimeoutObject);
            toolbarTimeoutObject = null;
        } else {
            if (Toolbar.isVisible()) {
                toolbarTimeoutObject = setTimeout(hideToolbar, toolbarTimeout);
            } else {
                this.showToolbar();
            }
        }
    }
};

module.exports = ToolbarToggler;
