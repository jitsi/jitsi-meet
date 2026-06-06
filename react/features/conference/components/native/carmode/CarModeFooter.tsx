import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View, ViewStyle } from 'react-native';

import EndMeetingButton from './EndMeetingButton';
import SoundDeviceButton from './SoundDeviceButton';
import styles from './styles';

/**
 * Implements the car mode footer component.
 *
 * @returns { JSX.Element} - The car mode footer component.
 */
const CarModeFooter = (): JSX.Element => {
    const { t } = useTranslation();

    return (
        <View
            pointerEvents = 'box-none'
            style = { styles.bottomContainer as ViewStyle }>
            <Text style = { styles.videoStoppedLabel }>
                { t('carmode.labels.videoStopped') }
            </Text>
            <SoundDeviceButton />
            <EndMeetingButton />
        </View>
    );
};

export default CarModeFooter;
