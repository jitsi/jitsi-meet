import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    StyleProp,
    Text,
    TextStyle,
    View,
    ViewStyle
} from 'react-native';

import { preJoinStyles as styles } from './styles';


const RecordingWarning = (): JSX.Element => {
    const { t } = useTranslation();

    return (
        <View style = { styles.recordingWarning as StyleProp<ViewStyle> }>
            <Text
                numberOfLines = { 1 }
                style = { styles.recordingWarningText as StyleProp<TextStyle> }>
                { t('prejoin.recordingWarning') }
            </Text>
        </View>
    );
};

export default RecordingWarning;
