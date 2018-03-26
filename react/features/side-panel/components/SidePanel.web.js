import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { closePanel } from '../actions';

/**
 * React Component for holding features in a side panel that slides in and out.
 *
 * @extends Component
 */
class SidePanel extends Component {
    /**
     * {@code SidePanel} component's property types.
     *
     * @static
     */
    static propTypes = {
        dispatch: PropTypes.func
    };

    /**
     * Initializes a new {@code SidePanel} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._onCloseClick = this._onCloseClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div id = 'sideToolbarContainer'>
                <div
                    className = 'side-toolbar-close'
                    onClick = { this._onCloseClick }>
                    X
                </div>
            </div>
        );
    }

    /**
     * Callback invoked to hide {@code SidePanel}.
     *
     * @returns {void}
     */
    _onCloseClick() {
        this.props.dispatch(closePanel());
    }
}

export default connect()(SidePanel);
