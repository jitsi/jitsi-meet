import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    StyleProp,
    Text,
    TextStyle,
    View,
    ViewStyle
} from 'react-native';

import Icon from '../../../base/icons/components/Icon';
import { IconRecord } from '../../../base/icons/svg';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';

import { preJoinStyles as styles } from './styles';


const RecordingWarning = (): JSX.Element => {
    const { t } = useTranslation();
    const color = BaseTheme.palette.icon04;

    return (
        <View style = { styles.recordingWarningContainer as StyleProp<ViewStyle> }>
            <View style = { styles.recordingWarning as StyleProp<ViewStyle> }>
                <Icon
                    color = { color }
                    size = { 20 }
                    src = { IconRecord } />
                <Text
                    numberOfLines = { 1 }
                    style = { styles.recordingWarningText as StyleProp<TextStyle> }>
                    { t('prejoin.recordingWarning') }
                </Text>
            </View>
        </View>
    );
};

export default RecordingWarning;
