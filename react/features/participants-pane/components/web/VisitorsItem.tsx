import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.web';
import { approveRequest, denyRequest } from '../../../visitors/actions';
import { IPromotionRequest } from '../../../visitors/types';
import { ACTION_TRIGGER, MEDIA_STATE } from '../../constants';

import ParticipantItem from './ParticipantItem';

interface IProps {

    /**
     * Promotion request reference.
     */
    request: IPromotionRequest;
}

const useStyles = makeStyles()(theme => {
    return {
        button: {
            marginRight: theme.spacing(2)
        },
        moreButton: {
            paddingRight: '6px',
            paddingLeft: '6px',
            marginRight: theme.spacing(2)
        },
        contextMenu: {
            position: 'fixed',
            top: 'auto',
            marginRight: '8px'
        }
    };
});

export const VisitorsItem = ({
    request: r
}: IProps) => {
    const { from, nick } = r;
    const { t } = useTranslation();
    const { classes: styles } = useStyles();
    const dispatch = useDispatch();
    const admit = useCallback(() => dispatch(approveRequest(r)), [ dispatch, r ]);
    const reject = useCallback(() => dispatch(denyRequest(r)), [ dispatch, r ]);

    return (
        <ParticipantItem
            actionsTrigger = { ACTION_TRIGGER.PERMANENT }
            audioMediaState = { MEDIA_STATE.NONE }
            displayName = { nick }
            participantID = { from }
            raisedHand = { true }
            videoMediaState = { MEDIA_STATE.NONE }
            youText = { t('chat.you') }>

            {<>
                <Button
                    accessibilityLabel = { `${t('participantsPane.actions.reject')} ${r.nick}` }
                    className = { styles.button }
                    labelKey = 'participantsPane.actions.reject'
                    onClick = { reject }
                    size = 'small'
                    testId = { `reject-${from}` }
                    type = { BUTTON_TYPES.DESTRUCTIVE } />
                <Button
                    accessibilityLabel = { `${t('participantsPane.actions.admit')} ${r.nick}` }
                    className = { styles.button }
                    labelKey = 'participantsPane.actions.admit'
                    onClick = { admit }
                    size = 'small'
                    testId = { `admit-${from}` } />
            </>
            }
        </ParticipantItem>
    );
};
