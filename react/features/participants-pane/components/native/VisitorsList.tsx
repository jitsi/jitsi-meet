import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View, ViewStyle } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import Button from '../../../base/ui/components/native/Button';
import { BUTTON_MODES, BUTTON_TYPES } from '../../../base/ui/constants.native';
import { admitMultiple, goLive } from '../../../visitors/actions';
import {
    getPromotionRequests,
    getVisitorsCount,
    getVisitorsInQueueCount,
    isVisitorsLive
} from '../../../visitors/functions';

import { VisitorsItem } from './VisitorsItem';
import styles from './styles';

const VisitorsList = () => {
    const visitorsCount = useSelector(getVisitorsCount);

    const dispatch = useDispatch();

    const requests = useSelector(getPromotionRequests);

    const admitAll = useCallback(() => {
        dispatch(admitMultiple(requests));
    }, [ dispatch, requests ]);
    const goLiveCb = useCallback(() => {
        dispatch(goLive());
    }, [ dispatch ]);
    const { t } = useTranslation();

    const visitorsInQueueCount = useSelector(getVisitorsInQueueCount);
    const isLive = useSelector(isVisitorsLive);
    const showVisitorsInQueue = visitorsInQueueCount > 0 && isLive === false;

    if (visitorsCount <= 0 && !showVisitorsInQueue) {
        return null;
    }

    let title = t('participantsPane.headings.visitors', { count: visitorsCount });

    if (requests.length > 0) {
        title += t('participantsPane.headings.visitorRequests', { count: requests.length });
    }

    if (showVisitorsInQueue) {
        title += t('participantsPane.headings.visitorInQueue', { count: visitorsInQueueCount });
    }

    return (
        <>
            <View style = { styles.listDetails as ViewStyle } >
                <Text style = { styles.visitorsLabel }>
                    { title }
                </Text>
                {
                    requests.length > 1 && !showVisitorsInQueue && (
                        <Button
                            accessibilityLabel = 'participantsPane.actions.admitAll'
                            labelKey = 'participantsPane.actions.admitAll'
                            mode = { BUTTON_MODES.TEXT }
                            onClick = { admitAll }
                            type = { BUTTON_TYPES.PRIMARY } />
                    )
                }
                {
                    showVisitorsInQueue && (
                        <Button
                            accessibilityLabel = 'participantsPane.actions.goLive'
                            labelKey = 'participantsPane.actions.goLive'
                            mode = { BUTTON_MODES.TEXT }
                            onClick = { goLiveCb }
                            type = { BUTTON_TYPES.PRIMARY } />
                    )
                }
            </View>
            {
                requests.map(r => (
                    <VisitorsItem
                        key = { r.from }
                        request = { r } />)
                )
            }
        </>
    );
};

export default VisitorsList;
