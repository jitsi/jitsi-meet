import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import { SvgUri } from 'react-native-svg';

import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
// @ts-ignore
import { navigateRoot } from '../rootNavigationContainerRef';
// @ts-ignore
import { screen } from '../routes';
// @ts-ignore
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
// @ts-ignore
import { navigationStyles } from './styles';


const ClosePage = () => {
    const { t } = useTranslation();

    return (
        <JitsiScreen style = { navigationStyles.closeScreenContainer }>
            <View style = { navigationStyles.credit }>
                <Text
                    style = { navigationStyles.creditText }>{ t('poweredby') }</Text>
                <SvgUri
                    height = '100%'
                    preserveAspectRatio = 'xMinYMin'
                    style = { navigationStyles.creditImage as StyleProp<ViewStyle> }
                    uri = '../../../../../images/watermark.svg'
                    viewBox = '0 0 120 400'
                    width = '100%' />
            </View>
            <Button
                accessibilityLabel = 'Start another meeting'
                labelKey = 'Start another meeting'
                onClick = {() => navigateRoot(screen.welcome.main)}
                type = { BUTTON_TYPES.PRIMARY } />
        </JitsiScreen>
    );
};

export default ClosePage;
