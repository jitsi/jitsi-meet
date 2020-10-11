// @flow

import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { ConfirmDialog, hideDialog } from '../../../base/dialog';
import { connect } from '../../../base/redux';
import { jitsiLocalStorage } from '@jitsi/js-utils';
/**
 * The type of the React {@code Component} props of {@link RoomLockPrompt}.
 */
type Props = {

    /**
     * The list of people to exclude
     */
    exclude: Object,


    /**
     * Redux store dispatch function.
     */
    dispatch: Dispatch<any>
};

/**
 * Implements a React Component which prompts the user for a confirmation to kick everyone in the room
 */
class ScreenshareWarningPrompt extends Component<Props> {
    /**
     * Initializes a new KickEveryonePrompt instance.
     *
     * @param {Props} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
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
            <ConfirmDialog
                contentKey='dialog.screenShareWarning'
                onCancel={this._onCancel}
                onSubmit={this._onSubmit}
            />
        );
    }

    _onCancel: () => boolean;

    /**
     * Notifies this prompt that it has been dismissed by cancel.
     *
     * @private
     * @returns {boolean} True to hide this dialog/prompt; otherwise, false.
     */
    _onCancel() {
        this.props.dispatch(hideDialog(ScreenshareWarningPrompt))

        return true;
    }

    _onSubmit: () => boolean;

    /**
     * Notifies this prompt that it has been dismissed by submitting a specific
     * value.
     * TODO: Fix the comments
     * @param {string|undefined} value - The submitted value.
     * @private
     * @returns {boolean} False because we do not want to hide this
     * dialog/prompt as the hiding will be handled inside endRoomLockRequest
     * after setting the password is resolved.
     */
    _onSubmit() {
        jitsiLocalStorage.setItem('showScreenshare', true)
        this.props.dispatch(hideDialog(ScreenshareWarningPrompt))


        return true;
    }

}

export default connect()(ScreenshareWarningPrompt);

