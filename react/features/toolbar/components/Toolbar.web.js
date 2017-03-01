/* @flow */

declare var AJS: Object;
declare var APP: Object;
declare var config: Object;
declare var interfaceConfig: Object;
declare var $: Function;

import { connect } from 'react-redux';
import React from 'react';

import { FeedbackButton } from '../../feedback';
import Recording from '../../../../modules/UI/recording/Recording';
import UIUtil from '../../../../modules/UI/util/UIUtil';
import UIEvents from '../../../../service/UI/UIEvents';

import { AbstractToolbar, _mapStateToProps } from './AbstractToolbar';
import DEFAULT_TOOLBAR_BUTTONS from './defaultToolbarButtons';
import primaryToolbarHandlers from './primaryToolbarHandlers';
import secondaryToolbarHandlers from './secondaryToolbarHandlers';
import ToolbarButton from './ToolbarButton';

/**
 * Handlers for toolbar buttons.
 *
 * buttonId {string}: handler {function}
 */
const BUTTON_HANDLERS = Object.assign({}, primaryToolbarHandlers,
    secondaryToolbarHandlers);

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
     * Constructor of Toolbar component.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind methods to save the context
        const self: any = this;

        self._onLocalRaiseHandChanged
            = this._onLocalRaiseHandChanged.bind(this);
        self._onFullScreenToggled = this._onFullScreenToggled.bind(this);
    }

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
                acc[place].set(button.id, button);
            }

            return acc;
        }, {
            primaryToolbar: new Map(),
            secondaryToolbar: new Map()
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
        const button = this.state.secondaryToolbar.get(buttonId);

        if (isRaisedHand) {
            button.toggled = true;
        } else {
            button.toggled = false;
        }

        this.setState(prevState =>
            prevState.secondaryToolbar.set(buttonId, button)
        );
    }

    /**
     * Event handler for full screen toggled event.
     *
     * @param {boolean} isFullScreen - Flag showing whether app in full
     * screen mode.
     * @returns {void}
     */
    _onFullScreenToggled(isFullScreen) {
        const buttonId = 'toolbar_button_fullScreen';
        const button = this.state.primaryToolbar.get(buttonId);

        if (isFullScreen) {
            button.toggled = true;
            button.className = button.className
                .replace('icon-full-screen', 'icon-exit-full-screen');
        } else {
            button.toggled = false;
            button.className = button.className
                .replace('icon-exit-full-screen', 'icon-full-screen');
        }

        this.setState(prevState =>
            prevState.primaryToolbar.set(buttonId, button)
        );
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
        const renderPrimaryToolbarButton = (acc, button, index) => {
            const isSplitter = interfaceConfig.MAIN_TOOLBAR_SPLITTER_INDEX
                && index === interfaceConfig.MAIN_TOOLBAR_SPLITTER_INDEX;

            if (isSplitter) {
                const splitter = <span className = 'toolbar__splitter' />;

                acc.push(splitter);
            }

            const toolbarButton = this._renderToolbarButton(button);

            acc.push(toolbarButton);

            return acc;
        };

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
                        [ ...this.state.primaryToolbar.values() ]
                            .reduce(renderPrimaryToolbarButton, [])
                    }
                </div>
            </div>
        );
    }

    /**
     * Renders toolbar button.
     *
     * @param {Object} button - Object representing the button.
     * @returns {ReactElement}
     * @private
     */
    _renderToolbarButton(button) {
        const onClick = event => {
            const handler = BUTTON_HANDLERS[button.id];

            if (!$(event.target).prop('disabled') && handler) {
                handler(event);
            }
        };

        return (
            <ToolbarButton
                { ...button }
                key = { button.id }
                onClick = { onClick } />
        );
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
                    [ ...this.state.secondaryToolbar.values() ]
                        .map(this._renderToolbarButton)
                }

                <FeedbackButton />

                <div id = 'sideToolbarContainer' />
            </div>
        );
    }
}

export default connect(_mapStateToProps)(Toolbar);
