import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import Dialog from '../../../../../base/ui/components/web/Dialog';
import Input from '../../../../../base/ui/components/web/Input';
import { renameBreakoutRoom } from '../../../../../breakout-rooms/actions';
import { IBreakoutRoomNamePromptProps as IProps } from '../../../../types';

/**
 * Implements a React {@code Component} for displaying a dialog with an field
 * for setting a breakout room's name.
 *
 * @param {IProps} props - The props of the component.
 * @returns {JSX.Element}
 */
export default function BreakoutRoomNamePrompt({ breakoutRoomJid, initialRoomName }: IProps) {
    const [ roomName, setRoomName ] = useState(initialRoomName?.trim());
    const { t } = useTranslation();
    const okDisabled = !roomName;
    const dispatch = useDispatch();
    const onBreakoutRoomNameChange = useCallback((newRoomName: string) => {
        setRoomName(newRoomName);
    }, [ setRoomName ]);
    const onSubmit = useCallback(() => {
        dispatch(renameBreakoutRoom(breakoutRoomJid, roomName?.trim()));
    }, [ breakoutRoomJid, dispatch, roomName ]);

    return (<Dialog
        ok = {{
            disabled: okDisabled,
            translationKey: 'dialog.Ok'
        }}
        onSubmit = { onSubmit }
        titleKey = 'dialog.renameBreakoutRoomTitle'>
        <Input
            autoFocus = { true }
            className = 'dialog-bottom-margin'
            id = 'breakout-rooms-name-input'
            label = { t('dialog.renameBreakoutRoomLabel') }
            name = 'breakoutRoomName'
            onChange = { onBreakoutRoomNameChange }
            type = 'text'
            value = { roomName } />
    </Dialog>);
}

