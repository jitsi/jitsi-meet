/* @flow */

declare var AJS: Object;
declare var APP: Object;
declare var config: Object;
declare var interfaceConfig: Object;
declare var $: Function;

import { connect } from 'react-redux';
import React from 'react';

import Recording from '../../../../modules/UI/recording/Recording';
import OldToolbar from '../../../../modules/UI/toolbars/Toolbar';
import UIEvents from '../../../../service/UI/UIEvents';
import UIUtil from '../../../../modules/UI/util/UIUtil';

import { AbstractToolbar, _mapStateToProps } from './AbstractToolbar';
import DEFAULT_TOOLBAR_BUTTONS from './defaultToolbarButtons';
import { FeedbackButton } from '../../feedback';
import ToolbarButton from './ToolbarButton';

/**
 * For legacy reasons, inline style for display none.
 *
 * @private
 * @type {{
 *     display: string
 * }}
 */
const _DISPLAY_NONE_STYLE = {
    display: 'none'
};

/**
 * Implements the conference toolbar on React.
 *
 * @extends AbstractToolbar
 */
class Toolbar extends AbstractToolbar {

    /**
     * Toolbar component's property types.
     *
     * @static
     */
    static propTypes = AbstractToolbar.propTypes;

    /**
     * Defines buttons to render in primary and secondary toolbars.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillMount() {
        const {
            primaryToolbar,
            secondaryToolbar
        } = interfaceConfig.TOOLBAR_BUTTONS.reduce((acc, buttonName) => {
            const button = DEFAULT_TOOLBAR_BUTTONS[buttonName];

            if (button) {
                const place = this._getToolbarButtonPlace(buttonName);

                button.buttonName = buttonName;
                acc[place].push(button);
            }

            return acc;
        }, {
            primaryToolbar: [],
            secondaryToolbar: []
        });

        this.setState({
            primaryToolbar,
            secondaryToolbar
        });
    }

    /**
    * Get place for toolbar button.
    * Now it can be in main toolbar or in extended (left) toolbar.
    *
    * @param {string} btn - Button name.
    * @returns {string}
    */
    _getToolbarButtonPlace(btn) {
        return interfaceConfig.MAIN_TOOLBAR_BUTTONS.includes(btn)
            ? 'primaryToolbar'
            : 'secondaryToolbar';
    }

    /**
     * Registers listeners after mounting the component.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this._registerListeners();

        // Initialise the recording module.
        if (config.enableRecording) {
            const eventEmitter = APP.UI.eventEmitter;

            Recording.init(eventEmitter, config.recordingType);
        }

        // Display notice message at the top of the toolbar
        if (config.noticeMessage) {
            $('#noticeText').text(config.noticeMessage);
            UIUtil.setVisible('notice', true);
        }
    }

    /**
     * Register listeners for some of UI events.
     *
     * @private
     * @returns {void}
     */
    _registerListeners() {
        APP.UI.addListener(UIEvents.SIDE_TOOLBAR_CONTAINER_TOGGLED,
            this._onSideToolbarContainerToggled);

        APP.UI.addListener(UIEvents.LOCAL_RAISE_HAND_CHANGED,
            this._onLocalRaiseHandChanged);

        APP.UI.addListener(UIEvents.FULLSCREEN_TOGGLED,
            this._onFullScreenToggled);

        APP.UI.addListener(UIEvents.SHOW_CUSTOM_TOOLBAR_BUTTON_POPUP,
            this._onShowCustomToolbarPopup);


    }

    /**
     * Event handler for side toolbar container toggled event.
     *
     * @param {string} containerId - ID of the container.
     * @returns {void}
     */
    _onSideToolbarContainerToggled(containerId) {
        Object.keys(DEFAULT_TOOLBAR_BUTTONS).forEach(
            id => {
                if (!UIUtil.isButtonEnabled(id)) {
                    return;
                }

                const button = DEFAULT_TOOLBAR_BUTTONS[id];

                if (button.sideContainerId
                    && button.sideContainerId === containerId) {
                    UIUtil.buttonClick(button.id, 'selected');

                    return;
                }
            }
        );
    }

    /**
     * Event handler for local raise hand changed event.
     *
     * @param {boolean} isRaisedHand - Flag showing whether hand is raised.
     * @returns {void}
     */
    _onLocalRaiseHandChanged(isRaisedHand) {
        const buttonId = 'toolbar_button_raisehand';

        OldToolbar._setToggledState(buttonId, isRaisedHand);
    }

    /**
     * Event handler for full screen toggled event.
     *
     * @param {boolean} isFullScreen - Flag showing whether app in full
     * screen mode.
     * @returns {void}
     */
    _onFullScreenToggled(isFullScreen) {
        const element
            = document.getElementById('toolbar_button_fullScreen');

        element.className = isFullScreen
            ? element.className
            .replace('icon-full-screen', 'icon-exit-full-screen')
            : element.className
            .replace('icon-exit-full-screen', 'icon-full-screen');

        const buttonId = 'toolbar_button_fullScreen';

        OldToolbar._setToggledState(buttonId, isFullScreen);
    }

    /**
     * Show custom popup/tooltip for a specified button.
     *
     * @param {string} popupSelectorID - The selector id of the popup to show.
     * @param {boolean} show - True or false/show or hide the popup.
     * @param {number} timeout - The time to show the popup.
     * @returns {void}
     */
    _onShowCustomToolbarPopup(popupSelectorID, show, timeout) {
        const gravity = $(popupSelectorID).attr('tooltip-gravity');

        AJS.$(popupSelectorID)
            .tooltip({
                trigger: 'manual',
                html: true,
                gravity,
                title: 'title' });
        if (show) {
            AJS.$(popupSelectorID).tooltip('show');
            setTimeout(() => {
                // hide the tooltip
                AJS.$(popupSelectorID).tooltip('hide');
            }, timeout);
        } else {
            AJS.$(popupSelectorID).tooltip('hide');
        }
    }

    /**
     * Unregisters listeners before unmounting the component.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        this._unregisterListeners();
    }

    /**
     * Unregisters listeners of some UI events.
     *
     * @private
     * @returns {void}
     */
    _unregisterListeners() {
        APP.UI.removeListener(UIEvents.SIDE_TOOLBAR_CONTAINER_TOGGLED,
            this._onSideToolbarContainerToggled);

        APP.UI.removeListener(UIEvents.LOCAL_RAISE_HAND_CHANGED,
            this._onLocalRaiseHandChanged);

        APP.UI.removeListener(UIEvents.FULLSCREEN_TOGGLED,
            this._onFullScreenToggled);

        APP.UI.removeListener(UIEvents.SHOW_CUSTOM_TOOLBAR_BUTTON_POPUP,
            this._onShowCustomToolbarPopup);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div>
                {
                    this._renderPrimaryToolbar()
                }
                {
                    this._renderSecondaryToolbar()
                }
            </div>
        );
    }

    /**
     * Renders primary toolbar.
     *
     * @returns {ReactElement}
     * @private
     */
    _renderPrimaryToolbar() {
        return (
            <div id = 'mainToolbarContainer'>
                <div
                    className = 'notice'
                    id = 'notice'
                    style = { _DISPLAY_NONE_STYLE }>
                    <span
                        className = 'noticeText'
                        id = 'noticeText' />
                </div>
                <div
                    className = 'toolbar'
                    id = 'mainToolbar'>
                    {
                        this.state.primaryToolbar
                            .reduce(this._renderPrimaryToolbarButton, [])
                    }
                </div>
            </div>
        );
    }

    /**
     * Method applied to all elements in primary toolbar buttons array.
     *
     * @param {Array} acc - Accumulator object.
     * @param {Object} button - Object representing the button.
     * @param {number} index - Current index of the element in array.
     * @returns {Array}
     * @private
     */
    _renderPrimaryToolbarButton(acc, button, index) {
        const isSplitter = interfaceConfig.MAIN_TOOLBAR_SPLITTER_INDEX
            && index === interfaceConfig.MAIN_TOOLBAR_SPLITTER_INDEX;

        if (isSplitter) {
            const splitter = <span className = 'toolbar__splitter' />;

            acc.push(splitter);
        }

        // eslint-disable-next-line no-extra-parens
        const toolbarButton = (
            <ToolbarButton
                { ...button }
                key = { button.id } />
        );

        acc.push(toolbarButton);

        return acc;
    }

    /**
     * Renders secondary toolbar.
     *
     * @returns {ReactElement}
     * @private
     */
    _renderSecondaryToolbar() {
        return (
            <div
                className = 'toolbar'
                id = 'extendedToolbar'>
                <div id = 'extendedToolbarButtons' />

                {
                    this.state.secondaryToolbar.map(button =>
                        <ToolbarButton
                            { ...button }
                            key = { button.id } />
                    )
                }

                <FeedbackButton />

                <div id = 'sideToolbarContainer' />
            </div>
        );
    }
}

export default connect(_mapStateToProps)(Toolbar);
