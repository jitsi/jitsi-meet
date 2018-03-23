// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { setToolbarHovered } from '../actions';

import { HangupButton } from './buttons';

type Props = {

    /**
     * Whether or not the toolbox should be visible.
     */
    _visible: boolean,

    /**
     * Invoked to notify redux of state changes.
     */
    dispatch: Function
}

declare var interfaceConfig: Object;

/**
 * Implements the conference toolbox, which holds a toolbar, on React Web.
 *
 * @extends Comonent
 */
class ToolboxV2 extends Component<Props> {
    _visibleButtons: Object;

    /**
     * Initializes a new {@code ToolboxV2} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        /**
         * A Set of buttons configured to display in the toolbar. A set is used
         * for quicker looked of configured buttons.
         *
         * @private
         * @type {Set}
         */
        this._visibleButtons = new Set(interfaceConfig.TOOLBAR_BUTTONS);

        // Bind event handlers so they are only bound once for every instance.
        this._onMouseOut = this._onMouseOut.bind(this);
        this._onMouseOver = this._onMouseOver.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _visible } = this.props;
        const rootClassNames = `new-toolbox ${_visible ? 'visible' : ''} ${
            this._visibleButtons.size ? '' : 'no-buttons'}`;


        return (
            <div
                className = { rootClassNames }
                id = 'new-toolbox'
                onMouseOut = { this._onMouseOut }
                onMouseOver = { this._onMouseOver }>
                <div className = 'button-group-left' />
                <div className = 'button-group-center'>
                    { this._shouldShowButton('hangup')
                        && <HangupButton /> }
                </div>
                <div className = 'button-group-right' />
            </div>
        );
    }

    _onMouseOut: () => void;

    /**
     * Dispatches an action signaling the toolbar is not being hovered.
     *
     * @private
     * @returns {void}
     */
    _onMouseOut() {
        this.props.dispatch(setToolbarHovered(false));
    }

    _onMouseOver: () => void;

    /**
     * Dispatches an action signaling the toolbar is being hovered.
     *
     * @private
     * @returns {void}
     */
    _onMouseOver() {
        this.props.dispatch(setToolbarHovered(true));
    }

    _shouldShowButton: (string) => boolean;

    /**
     * Returns whether or not a given button name has been explicitly
     * configured to be displayed.
     *
     * @param {string} buttonName - The name of the button, as expected in
     * {@link intefaceConfig}.
     * @private
     * @returns {boolean} True if the button should be displayed.
     */
    _shouldShowButton(buttonName) {
        return this._visibleButtons.has(buttonName);
    }
}

/**
 * Maps (parts of) the redux state to {@link ToolboxV2}'s React
 * {@code Component} props.
 *
 * @param {Object} state - The redux store/state.
 * @private
 * @returns {{
 *     _visible: boolean
 * }}
 */
function _mapStateToProps(state) {
    const {
        alwaysVisible,
        timeoutID,
        visible
    } = state['features/toolbox'];

    return {
        _visible: Boolean(timeoutID || visible || alwaysVisible)
    };
}

export default connect(_mapStateToProps)(ToolboxV2);
