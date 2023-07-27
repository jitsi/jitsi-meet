import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { IconRaiseHand } from '../../../base/icons/svg';
import Label from '../../../base/label/components/web/Label';
import Tooltip from '../../../base/tooltip/components/Tooltip';
import { open as openParticipantsPane } from '../../../participants-pane/actions.web';

const useStyles = makeStyles()(theme => {
    return {
        label: {
            backgroundColor: theme.palette.warning02,
            color: theme.palette.uiBackground
        }
    };
});

const RaisedHandsCountLabel = () => {
    const { classes: styles, theme } = useStyles();
    const dispatch = useDispatch();
    const raisedHandsCount = useSelector((state: IReduxState) =>
        (state['features/base/participants'].raisedHandsQueue || []).length);
    const { t } = useTranslation();
    const onClick = useCallback(() => {
        dispatch(openParticipantsPane());
    }, []);

    return raisedHandsCount > 0 ? (<Tooltip
        content = { t('raisedHandsLabel') }
        position = { 'bottom' }>
        <Label
            accessibilityText = { t('raisedHandsLabel') }
            className = { styles.label }
            icon = { IconRaiseHand }
            iconColor = { theme.palette.icon04 }
            id = 'raisedHandsCountLabel'
            onClick = { onClick }
            text = { `${raisedHandsCount}` } />
    </Tooltip>) : null;
};

export default RaisedHandsCountLabel;
