/* @flow */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { getToolbarClassNames } from '../functions';
import Toolbar from './Toolbar';

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
         * Contains toolbar buttons for primary toolbar.
         */
        _primaryToolbarButtons: PropTypes.instanceOf(Map),

        /**
         * Shows whether toolbox is visible.
         */
        _visible: PropTypes.bool
    };

    state: Object;

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

        const { primaryToolbarClassName } = getToolbarClassNames(this.props);
        const tooltipPosition
            = interfaceConfig.filmStripOnly ? 'left' : 'bottom';

        return (
            <Toolbar
                className = { primaryToolbarClassName }
                toolbarButtons = { _primaryToolbarButtons }
                tooltipPosition = { tooltipPosition } />
        );
    }
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

export default connect(_mapStateToProps)(PrimaryToolbar);
