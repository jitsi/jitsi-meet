import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { openDialog } from '../../../../../base/dialog/actions';
import { IconEdit } from '../../../../../base/icons/svg';
import { onActivationKey } from '../../../../../base/ui/functions.web';

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
    const { t } = useTranslation();
    const { classes, cx } = useStyles();
    const onRename = useCallback(() => {
        dispatch(openDialog('BreakoutRoomNamePrompt', BreakoutRoomNamePrompt, {
            breakoutRoomJid,
            initialRoomName: name
        }));
    }, [ dispatch, breakoutRoomJid, name ]);

    return (
        <span
            aria-label = { t('breakoutRooms.actions.rename') }
            className = { cx('jitsi-icon jitsi-icon-default', classes.container) }
            onClick = { onRename }
            onKeyDown = { onActivationKey(onRename) }
            role = 'button'
            tabIndex = { 0 }>
            <IconEdit
                height = { 16 }
                key = { 1 }
                width = { 16 } />
        </span>
    );
}
