/* @flow */

import React, { Component } from 'react';
import { connect } from 'react-redux';

import UIEvents from '../../../../service/UI/UIEvents';

import { showDesktopSharingButton, toggleFullScreen } from '../actions';
import { getToolbarClassNames } from '../functions';
import Toolbar from './Toolbar';

declare var APP: Object;
declare var interfaceConfig: Object;

/**
 * Implementation of PrimaryToolbar React Component.
 *
 * @class PrimaryToolbar
 * @extends Component
 */
class PrimaryToolbar extends Component {
    static propTypes = {
        /**
         * Handler for toggling fullscreen mode.
         */
        _onFullScreenToggled: React.PropTypes.func,

        /**
         * Handler for showing desktop sharing button.
         */
        _onShowDesktopSharingButton: React.PropTypes.func,

        /**
         * Contains toolbar buttons for primary toolbar.
         */
        _primaryToolbarButtons: React.PropTypes.instanceOf(Map),

        /**
         * Shows whether toolbox is visible.
         */
        _visible: React.PropTypes.bool
    };

    state: Object;

    /**
     * Constructs instance of primary toolbar React component.
     *
     * @param {Object} props - React component's properties.
     */
    constructor(props) {
        super(props);

        const buttonHandlers = {
            /**
             * Mount handler for desktop button.
             *
             * @type {Object}
             */
            desktop: {
                onMount: () => this.props._onShowDesktopSharingButton()
            },

            /**
             * Mount/Unmount handler for toggling fullscreen button.
             *
             * @type {Object}
             */
            fullscreen: {
                onMount: () =>
                    APP.UI.addListener(
                        UIEvents.FULLSCREEN_TOGGLED,
                        this.props._onFullScreenToggled),
                onUnmount: () =>
                    APP.UI.removeListener(
                        UIEvents.FULLSCREEN_TOGGLED,
                        this.props._onFullScreenToggled)
            }
        };
        const splitterIndex = interfaceConfig.MAIN_TOOLBAR_SPLITTER_INDEX;

        this.state = {

            /**
             * Object containing on mount/unmount handlers for toolbar buttons.
             *
             * @type {Object}
             */
            buttonHandlers,

            /**
             * If deployment supports toolbar splitter this value contains its
             * index.
             *
             * @type {number}
             */
            splitterIndex
        };
    }

    /**
     * Renders primary toolbar component.
     *
     * @returns {ReactElement}
     */
    render(): ReactElement<*> | null {
        const { _primaryToolbarButtons } = this.props;

        // The number of buttons to show in the toolbar isn't fixed, it depends
        // on the availability of features and configuration parameters. So
        // there may be nothing to render.
        if (_primaryToolbarButtons.size === 0) {
            return null;
        }

        const { buttonHandlers, splitterIndex } = this.state;
        const { primaryToolbarClassName } = getToolbarClassNames(this.props);
        const tooltipPosition
            = interfaceConfig.filmStripOnly ? 'left' : 'bottom';

        return (
            <Toolbar
                buttonHandlers = { buttonHandlers }
                className = { primaryToolbarClassName }
                splitterIndex = { splitterIndex }
                toolbarButtons = { _primaryToolbarButtons }
                tooltipPosition = { tooltipPosition } />
        );
    }
}

/**
 * Maps some of the Redux actions to the component props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @returns {{
 *     _onShowDesktopSharingButton: Function
 * }}
 * @private
 */
function _mapDispatchToProps(dispatch: Function): Object {
    return {
        /**
         * Dispatches an action signalling that full screen mode is toggled.
         *
         * @param {boolean} isFullScreen - Show whether fullscreen mode is on.
         * @returns {Object} Dispatched action.
         */
        _onFullScreenToggled(isFullScreen: boolean) {
            return dispatch(toggleFullScreen(isFullScreen));
        },

        /**
         * Dispatches an action signalling that desktop sharing button
         * should be shown.
         *
         * @returns {Object} Dispatched action.
         */
        _onShowDesktopSharingButton() {
            dispatch(showDesktopSharingButton());
        }
    };
}

/**
 * Maps part of Redux store to React component props.
 *
 * @param {Object} state - Snapshot of Redux store.
 * @returns {{
 *     _primaryToolbarButtons: Map,
 *     _visible: boolean
 * }}
 * @private
 */
function _mapStateToProps(state: Object): Object {
    const {
        primaryToolbarButtons,
        visible
    } = state['features/toolbox'];

    return {
        /**
         * Default toolbar buttons for primary toolbar.
         *
         * @private
         * @type {Map}
         */
        _primaryToolbarButtons: primaryToolbarButtons,

        /**
         * Shows whether toolbox is visible.
         *
         * @private
         * @type {boolean}
         */
        _visible: visible
    };
}

export default connect(_mapStateToProps, _mapDispatchToProps)(PrimaryToolbar);
