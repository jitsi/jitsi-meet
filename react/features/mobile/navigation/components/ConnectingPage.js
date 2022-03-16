// @flow

import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';

import { translate } from '../../../base/i18n';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { LoadingIndicator } from '../../../base/react';


import { navigationStyles, TEXT_COLOR } from './styles';

type Props = {

    /**
     * The Function to be invoked to translate i18n keys.
     */
    t: Function
};
const ConnectingPage = ({ t }: Props) => (
    <JitsiScreen style = { navigationStyles.connectingScreenContainer }>
        <View style = { navigationStyles.connectingScreenContent }>
            <SafeAreaView>
                <LoadingIndicator
                    color = { TEXT_COLOR }
                    size = 'large'
                    style = { navigationStyles.connectingScreenIndicator } />
                <Text style = { navigationStyles.connectingScreenText }>
                    {t('connectingOverlay.joiningRoom')}
                </Text>
            </SafeAreaView>
        </View>
    </JitsiScreen>
);

export default translate(ConnectingPage);
