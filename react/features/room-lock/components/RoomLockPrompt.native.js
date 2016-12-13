import React, { Component } from 'react';
import Prompt from 'react-native-prompt';
import { connect } from 'react-redux';

import { endRoomLockRequest } from '../actions';

/**
 * Implements a React Component which prompts the user for a password to lock  a
 * conference/room.
 */
class RoomLockPrompt extends Component {
    /**
     * RoomLockPrompt component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The JitsiConference which requires a password.
         *
         * @type {JitsiConference}
         */
        conference: React.PropTypes.object,
        dispatch: React.PropTypes.func
    }

    /**
     * Initializes a new RoomLockPrompt instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onCancel = this._onCancel.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Prompt
                onCancel = { this._onCancel }
                onSubmit = { this._onSubmit }
                placeholder = 'Password'
                title = 'Lock / Unlock room'
                visible = { true } />
        );
    }

    /**
     * Notifies this prompt that it has been dismissed by cancel.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        // An undefined password is understood to cancel the request to lock the
        // conference/room.
        this._onSubmit(undefined);
    }

    /**
     * Notifies this prompt that it has been dismissed by submitting a specific
     * value.
     *
     * @param {string} value - The submitted value.
     * @private
     * @returns {void}
     */
    _onSubmit(value) {
        this.props.dispatch(endRoomLockRequest(this.props.conference, value));
    }
}

export default connect()(RoomLockPrompt);
