// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { closePanel } from '../actions';

/**
 * The type of the React {@link Component} props of {@link SidePanel}.
 */
type Props = {

    /**
     * Invoked close the {@link SidePanel}.
     */
    dispatch: Dispatch<*>
};

/**
 * React Component for holding features in a side panel that slides in and out.
 *
 * @extends Component
 */
class SidePanel extends Component<Props> {
    /**
     * Initializes a new {@code SidePanel} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
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

    _onCloseClick: () => void;

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
