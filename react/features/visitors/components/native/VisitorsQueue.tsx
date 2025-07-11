import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { hangup } from '../../../base/connection/actions.native';
import LoadingIndicator from '../../../base/react/components/native/LoadingIndicator';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.any';
import styles from '../../../lobby/components/native/styles';

/**
 * The component that renders visitors queue UI.
 *
 * @returns {ReactElement}
 */
export default function VisitorsQueue() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const onHangupClick = useCallback(() => {
        dispatch(hangup());
    }, []);

    return (
        <View style = { styles.lobbyWaitingFragmentContainer }>
            <Text style = { styles.lobbyTitle }>
                { t('visitors.waitingMessage') }
            </Text>
            <LoadingIndicator
                color = { BaseTheme.palette.icon01 }
                style = { styles.loadingIndicator } />
            <Button
                accessibilityLabel = 'toolbar.accessibilityLabel.hangup'
                labelKey = 'toolbar.accessibilityLabel.hangup'
                onClick = { onHangupClick }
                type = { BUTTON_TYPES.TERTIARY } />
        </View>
    );
}
