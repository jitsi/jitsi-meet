// @flow

import React from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, Text, View } from 'react-native';

import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { LoadingIndicator } from '../../../base/react';

import { navigationStyles, TEXT_COLOR } from './styles';

const ConnectingPage = () => {
    const { t } = useTranslation();

    return (
        <JitsiScreen style = { navigationStyles.connectingScreenContainer }>
            <View style = { navigationStyles.connectingScreenContent }>
                <SafeAreaView>
                    <LoadingIndicator
                        color = { TEXT_COLOR }
                        size = 'large'
                        style = { navigationStyles.connectingScreenIndicator } />
                    <Text style = { navigationStyles.connectingScreenText }>
                        { t('connectingOverlay.joiningRoom') }
                    </Text>
                </SafeAreaView>
            </View>
        </JitsiScreen>
    );
};

export default ConnectingPage;
