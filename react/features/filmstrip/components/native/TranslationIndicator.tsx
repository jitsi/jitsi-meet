import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { TranslationTreatment } from '../../../audio-translation/constants';
import { IconTranslate } from '../../../base/icons/svg';
import BaseIndicator from '../../../base/react/components/native/BaseIndicator';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';

import styles from './styles';

interface IProps {

    /**
     * Which of the three treatments to render.
     */
    treatment: TranslationTreatment;
}

/**
 * Thumbnail badge for a participant's translation status: outlined (enabled), filled (receiving), dot (both).
 *
 * @param {IProps} props - The component's props.
 * @returns {ReactElement}
 */
const TranslationIndicator = ({ treatment }: IProps) => {
    const outlined = treatment === TranslationTreatment.ENABLED;

    return (
        <View
            style = { (outlined
                ? styles.translationIndicatorOutlined
                : styles.translationIndicatorFilled) as StyleProp<ViewStyle> }>
            <BaseIndicator
                icon = { IconTranslate }
                iconStyle = { outlined ? { color: BaseTheme.palette.action01 } : {} } />
            { treatment === TranslationTreatment.BOTH
                && <View style = { styles.translationIndicatorDot as StyleProp<ViewStyle> } /> }
        </View>
    );
};

export default TranslationIndicator;
