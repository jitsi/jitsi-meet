// @flow

import { Component } from 'react';
import type { Dispatch } from 'redux';

import { renameBreakoutRoom } from '../../../../breakout-rooms/actions';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractBreakoutRoomNamePrompt}.
 */
export type Props = {

    /**
     * The jid of the breakout room to rename.
     */
    breakoutRoomJid: string,

    /**
     * Invoked to update the breakout room's name.
     */
    dispatch: Dispatch<any>,

    /**
     * Function to be invoked after a successful breakout room name change.
     */
    onPostSubmit: ?Function,

    /**
     * The initial breakout room name.
     */
    initialRoomName: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Implements an abstract class for {@code BreakoutRoomNamePrompt}.
 */
export default class AbstractBreakoutRoomNamePrompt<S: *>
    extends Component <Props, S> {

    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onRenameBreakoutRoom = this._onRenameBreakoutRoom.bind(this);
    }

    _onRenameBreakoutRoom: string => boolean;

    /**
     * Dispatches an action to update the breakout room's name. A
     * name must be entered for the action to dispatch.
     *
     * It returns a boolean to comply the Dialog behaviour:
     *     {@code true} - the dialog should be closed.
     *     {@code false} - the dialog should be left open.
     *
     * @param {string} roomName - The breakout room name.
     * @returns {boolean}
     */
    _onRenameBreakoutRoom(roomName: string) {

        if (!roomName || !roomName.trim()) {
            return false;
        }

        const { breakoutRoomJid, dispatch, onPostSubmit } = this.props;

        dispatch(renameBreakoutRoom(breakoutRoomJid, roomName));

        onPostSubmit && onPostSubmit();

        return true;
    }
}
