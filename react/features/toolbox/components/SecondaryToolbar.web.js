/* @flow */

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { FeedbackButton } from '../../feedback';
import UIEvents from '../../../../service/UI/UIEvents';

import {
    changeLocalRaiseHand,
    setProfileButtonUnclickable,
    showRecordingButton,
    toggleSideToolbarContainer
} from '../actions';
import { getToolbarClassNames } from '../functions';
import Toolbar from './Toolbar';

declare var APP: Object;
declare var config: Object;

/**
 * Implementation of secondary toolbar React component.
 *
 * @class SecondaryToolbar
 * @extends Component
 */
class SecondaryToolbar extends Component {
    state: Object;

    /**
     * Secondary toolbar property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Handler dispatching local "Raise hand".
         */
        _onLocalRaiseHandChanged: React.PropTypes.func,

        /**
         * Handler setting profile button unclickable.
         */
        _onSetProfileButtonUnclickable: React.PropTypes.func,

        /**
         * Handler for showing recording button.
         */
        _onShowRecordingButton: React.PropTypes.func,

        /**
         * Handler dispatching toggle toolbar container.
         */
        _onSideToolbarContainerToggled: React.PropTypes.func,

        /**
         * Contains map of secondary toolbar buttons.
         */
        _secondaryToolbarButtons: React.PropTypes.instanceOf(Map),

        /**
         * Shows whether toolbox is visible.
         */
        _visible: React.PropTypes.bool
    };

    /**
     * Constructs instance of SecondaryToolbar component.
     *
     * @param {Object} props - React component properties.
     */
    constructor(props) {
        super(props);

        const buttonHandlers = {
            /**
             * Mount handler for profile button.
             *
             * @type {Object}
             */
            profile: {
                onMount: () =>
                    APP.tokenData.isGuest
                        || this.props._onSetProfileButtonUnclickable(true)
            },

            /**
             * Mount/Unmount handlers for raisehand button.
             *
             * @type {button}
             */
            raisehand: {
                onMount: () =>
                    APP.UI.addListener(
                        UIEvents.LOCAL_RAISE_HAND_CHANGED,
                        this.props._onLocalRaiseHandChanged),
                onUnmount: () =>
                    APP.UI.removeListener(
                        UIEvents.LOCAL_RAISE_HAND_CHANGED,
                        this.props._onLocalRaiseHandChanged)
            },

            /**
             * Mount handler for recording button.
             *
             * @type {Object}
             */
            recording: {
                onMount: () =>
                    config.enableRecording
                        && this.props._onShowRecordingButton()
            }
        };

        this.state = {
            /**
             * Object containing on mount/unmount handlers for toolbar buttons.
             *
             * @type {Object}
             */
            buttonHandlers
        };
    }

    /**
     * Register legacy UI listener.
     *
     * @returns {void}
     */
    componentDidMount(): void {
        APP.UI.addListener(
            UIEvents.SIDE_TOOLBAR_CONTAINER_TOGGLED,
            this.props._onSideToolbarContainerToggled);
    }

    /**
     * Unregisters legacy UI listener.
     *
     * @returns {void}
     */
    componentWillUnmount(): void {
        APP.UI.removeListener(
            UIEvents.SIDE_TOOLBAR_CONTAINER_TOGGLED,
            this.props._onSideToolbarContainerToggled);
    }

    /**
     * Renders secondary toolbar component.
     *
     * @returns {ReactElement}
     */
    render(): ReactElement<*> | null {
        const { _secondaryToolbarButtons } = this.props;

        // The number of buttons to show in the toolbar isn't fixed, it depends
        // on the availability of features and configuration parameters. So
        // there may be nothing to render.
        if (_secondaryToolbarButtons.size === 0) {
            return null;
        }

        const { buttonHandlers } = this.state;
        const { secondaryToolbarClassName } = getToolbarClassNames(this.props);

        return (
            <Toolbar
                buttonHandlers = { buttonHandlers }
                className = { secondaryToolbarClassName }
                toolbarButtons = { _secondaryToolbarButtons }
                tooltipPosition = { 'right' }>
                <FeedbackButton />
            </Toolbar>
        );
    }
}

/**
 * Maps some of Redux actions to component's props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @returns {{
 *     _onLocalRaiseHandChanged: Function,
 *     _onSetProfileButtonUnclickable: Function,
 *     _onShowRecordingButton: Function,
 *     _onSideToolbarContainerToggled
 * }}
 * @private
 */
function _mapDispatchToProps(dispatch: Function): Object {
    return {
        /**
         * Dispatches an action that 'hand' is raised.
         *
         * @param {boolean} isRaisedHand - Show whether hand is raised.
         * @returns {Object} Dispatched action.
         */
        _onLocalRaiseHandChanged(isRaisedHand: boolean) {
            return dispatch(changeLocalRaiseHand(isRaisedHand));
        },

        /**
         * Dispatches an action signalling to set profile button unclickable.
         *
         * @param {boolean} unclickable - Flag showing whether unclickable
         * property is true.
         * @returns {Object} Dispatched action.
         */
        _onSetProfileButtonUnclickable(unclickable: boolean) {
            return dispatch(setProfileButtonUnclickable(unclickable));
        },

        /**
         * Dispatches an action signalling that recording button should be
         * shown.
         *
         * @returns {Object} Dispatched action.
         */
        _onShowRecordingButton() {
            return dispatch(showRecordingButton());
        },

        /**
         * Dispatches an action signalling that side toolbar container is
         * toggled.
         *
         * @param {string} containerId - Id of side toolbar container.
         * @returns {Object} Dispatched action.
         */
        _onSideToolbarContainerToggled(containerId: string) {
            return dispatch(toggleSideToolbarContainer(containerId));
        }
    };
}

/**
 * Maps part of Redux state to component's props.
 *
 * @param {Object} state - Snapshot of Redux store.
 * @returns {{
 *     _secondaryToolbarButtons: Map,
 *     _visible: boolean
 * }}
 * @private
 */
function _mapStateToProps(state: Object): Object {
    const {
        secondaryToolbarButtons,
        visible
    } = state['features/toolbox'];

    return {
        /**
         * Default toolbar buttons for secondary toolbar.
         *
         * @private
         * @type {Map}
         */
        _secondaryToolbarButtons: secondaryToolbarButtons,

        /**
         * Shows whether toolbar is visible.
         *
         * @private
         * @type {boolean}
         */
        _visible: visible
    };
}

export default connect(_mapStateToProps, _mapDispatchToProps)(SecondaryToolbar);
