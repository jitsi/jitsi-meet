import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { openDialog } from '../../../../../base/dialog/actions';
import { IconEdit } from '../../../../../base/icons/svg';

import BreakoutRoomNamePrompt from './BreakoutRoomNamePrompt';

const useStyles = makeStyles()(_theme => {
    return {
        container: {
            position: 'absolute',
            cursor: 'pointer',
            marginTop: 2,
            marginLeft: 5
        }
    };
});

interface IProps {
    breakoutRoomJid: string;
    name?: string;
}

/**
 * Implements the rename button component which is displayed only for renaming a breakout room which is joined by the
 * user.
 *
 * @param {IProps} props - The props of the component.
 * @returns {JSX.Element}
 */
export default function RenameButton({ breakoutRoomJid, name }: IProps) {
    const dispatch = useDispatch();
    const { classes, cx } = useStyles();
    const onRename = useCallback(() => {
        dispatch(openDialog(BreakoutRoomNamePrompt, {
            breakoutRoomJid,
            initialRoomName: name
        }));
    }, [ dispatch, breakoutRoomJid, name ]);

    return (
        <span
            className = { cx('jitsi-icon jitsi-icon-default', classes.container) }
            onClick = { onRename }>
            <IconEdit
                height = { 16 }
                key = { 1 }
                width = { 16 } />
        </span>
    );
}
