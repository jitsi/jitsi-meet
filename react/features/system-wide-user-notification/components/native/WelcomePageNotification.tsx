import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextStyle, View, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';

import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { openURLInBrowser } from '../../../base/util/openURLInBrowser';
import { getSystemWideUserNotification, getTextKeys } from '../../functions';

import styles from './styles';

/**
 * Shows the system-wide user notification on the welcome page.
 *
 * @returns {ReactElement|null}
 */
const WelcomePageNotification = () => {
    const { t } = useTranslation();
    const config = useSelector(getSystemWideUserNotification);
    const url = config?.url;
    const onPress = useCallback(() => url && openURLInBrowser(url), [ url ]);

    if (!config || !url) {
        return null;
    }

    const { buttonKey, descriptionKey, titleKey } = getTextKeys(config);

    return (
        <View style = { styles.container as ViewStyle }>
            { titleKey && <Text style = { styles.title as TextStyle }>{ t(titleKey) }</Text> }
            { descriptionKey && <Text style = { styles.description as TextStyle }>{ t(descriptionKey) }</Text> }
            <Button
                accessibilityLabel = { buttonKey }
                labelKey = { buttonKey }
                onClick = { onPress }
                style = { styles.button }
                type = { BUTTON_TYPES.TERTIARY } />
        </View>
    );
};

export default WelcomePageNotification;
