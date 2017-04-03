import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Dialog } from '../../base/dialog';

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
            <Dialog
                bodyKey = 'dialog.passwordLabel'
                onCancel = { this._onCancel }
                onSubmit = { this._onSubmit }
                titleKey = 'toolbar.lock' />
        );
    }

    /**
     * Notifies this prompt that it has been dismissed by cancel.
     *
     * @private
     * @returns {boolean} whether to hide the dialog
     */
    _onCancel() {
        // An undefined password is understood to cancel the request to lock the
        // conference/room.
        return this._onSubmit(undefined);
    }

    /**
     * Notifies this prompt that it has been dismissed by submitting a specific
     * value.
     *
     * @param {string} value - The submitted value.
     * @private
     * @returns {boolean} returns false, we do not want to hide dialog as this
     * will be handled inside endRoomLockRequest after setting password is
     * resolved.
     */
    _onSubmit(value) {
        this.props.dispatch(endRoomLockRequest(this.props.conference, value));

        // do not hide
        return false;
    }
}

export default connect()(RoomLockPrompt);
