import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View, ViewStyle } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_MODES, BUTTON_TYPES } from '../../../base/ui/constants.native';
import { admitMultiple } from '../../../visitors/actions';
import { getPromotionRequests } from '../../../visitors/functions';

import { VisitorsItem } from './VisitorsItem';
import styles from './styles';

const VisitorsList = () => {
    const visitorsCount = useSelector((state: IReduxState) => state['features/visitors'].count || 0);

    const dispatch = useDispatch();

    const requests = useSelector(getPromotionRequests);

    const admitAll = useCallback(() => {
        dispatch(admitMultiple(requests));
    }, [ dispatch, requests ]);
    const { t } = useTranslation();

    if (visitorsCount <= 0) {
        return null;
    }

    let title = t('participantsPane.headings.visitors', { count: visitorsCount });

    if (requests.length > 0) {
        title += t('participantsPane.headings.visitorRequests', { count: requests.length });
    }

    return (
        <>
            <View style = { styles.listDetails as ViewStyle } >
                <Text style = { styles.visitorsLabel }>
                    { title }
                </Text>
                {
                    requests.length > 1 && (
                        <Button
                            accessibilityLabel = 'participantsPane.actions.admitAll'
                            labelKey = 'participantsPane.actions.admitAll'
                            mode = { BUTTON_MODES.TEXT }
                            onClick = { admitAll }
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
