/* eslint-disable lines-around-comment */

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Text, View } from 'react-native';

// @ts-ignore
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
// @ts-ignore
import { navigateRoot } from '../rootNavigationContainerRef';
// @ts-ignore
import { screen } from '../routes';

// @ts-ignore
import { navigationStyles } from './styles';


const ClosePage = () => {
    const { t } = useTranslation();
    const onClick = useCallback(() => navigateRoot(screen.welcome.main), []);

    return (
        <JitsiScreen style = { navigationStyles.closeScreenContainer }>
            <View style = { navigationStyles.credit }>
                <Text
                    style = { navigationStyles.creditText }>{ t('poweredby') }</Text>
                <Image
                    source = { require('../../../../../images/jitsilogo.png') } />
            </View>
            <Button
                accessibilityLabel = { t('startAnotherMeeting') }
                labelKey = { t('startAnotherMeeting') }
                onClick = { onClick }
                style = { navigationStyles.anotherMeetingButton }
                type = { BUTTON_TYPES.PRIMARY } />
        </JitsiScreen>
    );
};

export default ClosePage;
