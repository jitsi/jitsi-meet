import React from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, Text, View, ViewStyle } from 'react-native';

import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import LoadingIndicator from '../../../base/react/components/native/LoadingIndicator';

import { TEXT_COLOR, navigationStyles } from './styles';


const ConnectingPage = () => {
    const { t } = useTranslation();

    return (
        <JitsiScreen style = { navigationStyles.connectingScreenContainer }>
            <View style = { navigationStyles.connectingScreenContent as ViewStyle }>
                <SafeAreaView>
                    <LoadingIndicator
                        color = { TEXT_COLOR }
                        size = 'large' />
                    <Text style = { navigationStyles.connectingScreenText }>
                        { t('connectingOverlay.joiningRoom') }
                    </Text>
                </SafeAreaView>
            </View>
        </JitsiScreen>
    );
};

export default ConnectingPage;
