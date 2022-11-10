import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { IconRaiseHand } from '../../../base/icons/svg';
import Label from '../../../base/label/components/web/Label';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import { Tooltip } from '../../../base/tooltip';
import { open as openParticipantsPane } from '../../../participants-pane/actions';

const useStyles = makeStyles()(theme => {
    return {
        label: {
            backgroundColor: theme.palette.warning02,
            color: theme.palette.uiBackground,
            marginRight: theme.spacing(1)
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

    return raisedHandsCount > 0 && (<Tooltip
        content = { t('raisedHandsLabel') }
        position = { 'bottom' }>
        <Label
            className = { styles.label }
            icon = { IconRaiseHand }
            iconColor = { theme.palette.icon04 }
            id = 'raisedHandsCountLabel'
            onClick = { onClick }
            text = { `${raisedHandsCount}` } />
    </Tooltip>);
};

export default RaisedHandsCountLabel;
