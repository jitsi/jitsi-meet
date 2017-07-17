/* @flow */

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { FeedbackButton } from '../../feedback';
import UIEvents from '../../../../service/UI/UIEvents';

import {
    toggleSideToolbarContainer
} from '../actions';
import { getToolbarClassNames } from '../functions';
import Toolbar from './Toolbar';

declare var APP: Object;

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
         * The indicator which determines whether the local participant is a
         * guest in the conference.
         */
        _isGuest: React.PropTypes.bool,

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

        const { secondaryToolbarClassName } = getToolbarClassNames(this.props);

        return (
            <Toolbar
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
 *     _onSideToolbarContainerToggled
 * }}
 * @private
 */
function _mapDispatchToProps(dispatch: Function): Object {
    return {

        /**
         * Dispatches an action signalling that side toolbar container is
         * toggled.
         *
         * @param {string} containerId - Id of side toolbar container.
         * @returns {Object} Dispatched action.
         */
        _onSideToolbarContainerToggled(containerId: string) {
            dispatch(toggleSideToolbarContainer(containerId));
        }
    };
}

/**
 * Maps part of Redux state to component's props.
 *
 * @param {Object} state - Snapshot of Redux store.
 * @returns {{
 *     _isGuest: boolean,
 *     _secondaryToolbarButtons: Map,
 *     _visible: boolean
 * }}
 * @private
 */
function _mapStateToProps(state: Object): Object {
    const { isGuest } = state['features/jwt'];
    const { secondaryToolbarButtons, visible } = state['features/toolbox'];

    return {
        /**
         * The indicator which determines whether the local participant is a
         * guest in the conference.
         *
         * @private
         * @type {boolean}
         */
        _isGuest: isGuest,

        /**
         * Default toolbar buttons for secondary toolbar.
         *
         * @private
         * @type {Map}
         */
        _secondaryToolbarButtons: secondaryToolbarButtons,

        /**
         * The indicator which determines whether the {@code SecondaryToolbar}
         * is visible.
         *
         * @private
         * @type {boolean}
         */
        _visible: visible
    };
}

export default connect(_mapStateToProps, _mapDispatchToProps)(SecondaryToolbar);
