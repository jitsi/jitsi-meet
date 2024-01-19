import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import InputDialog from '../../../base/dialog/components/native/InputDialog';
import { IBreakoutRoomNamePromptProps as IProps } from '../../../participants-pane/types';
import { renameBreakoutRoom } from '../../actions';


/**
 * Implements a component to render a breakout room name prompt.
 *
 * @param {IProps} props - The props of the component.
 * @returns {JSX.Element}
 */
export default function BreakoutRoomNamePrompt({ breakoutRoomJid, initialRoomName }: IProps) {
    const dispatch = useDispatch();
    const onSubmit = useCallback((roomName: string) => {
        const formattedRoomName = roomName?.trim();

        if (formattedRoomName) {
            dispatch(renameBreakoutRoom(formattedRoomName, roomName));

            return true;
        }

        return false;
    }, [ breakoutRoomJid, dispatch ]);

    return (
        <InputDialog
            descriptionKey = 'dialog.renameBreakoutRoomTitle'
            initialValue = { initialRoomName?.trim() }
            onSubmit = { onSubmit } />
    );
}
