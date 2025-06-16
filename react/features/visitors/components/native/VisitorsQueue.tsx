import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import LoadingIndicator from '../../../base/react/components/native/LoadingIndicator';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import styles from '../../../lobby/components/native/styles';

/**
 * The component that renders visitors queue UI.
 *
 * @returns {ReactElement}
 */
export default function VisitorsQueue() {
    const { t } = useTranslation();

    return (
        <View style = { styles.lobbyWaitingFragmentContainer }>
            <Text style = { styles.lobbyTitle }>
                { t('visitors.waitingMessage') }
            </Text>
            <LoadingIndicator
                color = { BaseTheme.palette.icon01 }
                style = { styles.loadingIndicator } />
        </View>
    );
}
