// @flow

import { FieldTextStateless as TextField } from '@atlaskit/field-text';
import React from 'react';

import { Dialog } from '../../../../../base/dialog';
import { translate } from '../../../../../base/i18n';
import { connect } from '../../../../../base/redux';
import AbstractBreakoutRoomNamePrompt, {
    type Props
} from '../AbstractBreakoutRoomNamePrompt';

/**
 * The type of the React {@code Component} props of {@link BreakoutRoomNamePrompt}.
 */
type State = {

    /**
     * Whether the ok button is disabled.
     */
    okDisabled: string,

    /**
     * The name to show in the display name text field.
     */
    roomName: string
};

/**
 * Implements a React {@code Component} for displaying a dialog with an field
 * for setting a breakout room's name.
 *
 * @augments Component
 */
class BreakoutRoomNamePrompt extends AbstractBreakoutRoomNamePrompt<State> {

    /**
     * Initializes a new {@code DisplayNamePrompt} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            okDisabled: true,
            roomName: props.initialRoomName
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onBreakoutRoomNameChange = this._onBreakoutRoomNameChange.bind(this);
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
                isModal = { false }
                okDisabled = { this.state.okDisabled }
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.renameBreakoutRoomTitle'
                width = 'small'>
                <TextField
                    autoFocus = { true }
                    compact = { true }
                    label = { this.props.t('dialog.renameBreakoutRoomLabel') }
                    name = 'breakoutRoomName'
                    onChange = { this._onBreakoutRoomNameChange }
                    shouldFitContainer = { true }
                    type = 'text'
                    value = { this.state.roomName } />
            </Dialog>);
    }

    _onBreakoutRoomNameChange: (Object) => void;

    /**
     * Updates the entered room name.
     *
     * @param {Object} event - The DOM event triggered from the entered room
     * name value having changed.
     * @private
     * @returns {void}
     */
    _onBreakoutRoomNameChange(event) {
        const roomName = event.target.value;

        this.setState({
            okDisabled: !roomName.trim(),
            roomName
        });
    }

    _onRenameBreakoutRoom: (string, string) => boolean;

    _onSubmit: () => boolean;

    /**
     * Dispatches an action to update the breakout room's name. A
     * name must be entered for the action to dispatch.
     *
     * @private
     * @returns {boolean}
     */
    _onSubmit() {
        return this._onRenameBreakoutRoom(this.state.roomName);
    }
}

export default translate(connect()(BreakoutRoomNamePrompt));
