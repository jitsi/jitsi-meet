import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { openDialog } from '../../base/dialog/actions';
import Button from '../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../base/ui/constants.web';
import AutoBreakoutRoomCountPrompt from '../../participants-pane/components/breakout-rooms/components/web/AutoBreakoutRoomCountPrompt';

const useStyles = makeStyles()(theme => {
    return {
        button: {
            marginTop: theme.spacing(3)
        }
    };
});

export const AutoBreakoutRoomButton = () => {
    const { classes } = useStyles();
    const { t } = useTranslation();

    const dispatch = useDispatch();
    const onAutoDiscussClick = useCallback(async () => {
        dispatch(openDialog(AutoBreakoutRoomCountPrompt));
    }, [
        dispatch,
    ]);

    return (
        <Button
            accessibilityLabel = { t('autoBreakoutRooms.actions.button') }
            className = { classes.button }
            fullWidth = { true }
            labelKey = 'autoBreakoutRooms.actions.button'
            onClick = { onAutoDiscussClick }
            type = { BUTTON_TYPES.SECONDARY } />
    );
};

export default AutoBreakoutRoomButton;
