/* eslint-disable lines-around-comment */
import { makeStyles } from '@material-ui/styles';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IState } from '../../../app/types';
import { IconRaisedHand } from '../../../base/icons/svg/index';
// @ts-ignore
import { Label } from '../../../base/label';
// @ts-ignore
import { Tooltip } from '../../../base/tooltip';
import BaseTheme from '../../../base/ui/components/BaseTheme.web';
// @ts-ignore
import { open as openParticipantsPane } from '../../../participants-pane/actions';

const useStyles = makeStyles((theme: any) => {
    return {
        label: {
            backgroundColor: theme.palette.warning02,
            color: theme.palette.uiBackground,
            marginRight: theme.spacing(1)
        }
    };
});

const RaisedHandsCountLabel = () => {
    const styles = useStyles();
    const dispatch = useDispatch();
    const raisedHandsCount = useSelector((state: IState) =>
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
            icon = { IconRaisedHand }
            iconColor = { BaseTheme.palette.uiBackground }
            id = 'raisedHandsCountLabel'
            onClick = { onClick }
            text = { `${raisedHandsCount}` } />
    </Tooltip>);
};

export default RaisedHandsCountLabel;
