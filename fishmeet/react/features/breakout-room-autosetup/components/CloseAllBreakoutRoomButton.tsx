import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import Button from '../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../base/ui/constants.web';
import { triggerRemoveAllRooms } from '../actions';

const useStyles = makeStyles()(theme => {
    return {
        button: {
            marginTop: theme.spacing(3)
        }
    };
});

export const CloseAllBreakoutRoomButton = () => {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const onBtnClick = useCallback(async () => {
        if (!confirm(t('autoBreakoutRooms.confirm.closeAll'))) {
            return;
        }

        await dispatch(triggerRemoveAllRooms());
    }, []);

    return (
        <Button
            accessibilityLabel = { t('autoBreakoutRooms.actions.closeAllButton') }
            className = { classes.button }
            fullWidth = { true }
            labelKey = 'autoBreakoutRooms.actions.closeAllButton'
            onClick = { onBtnClick }
            type = { BUTTON_TYPES.SECONDARY } />
    );
};

export default CloseAllBreakoutRoomButton;
