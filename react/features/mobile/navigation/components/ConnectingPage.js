// @flow

import React, { PureComponent } from 'react';
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

/**
 * Connecting screen that suggests to the user that there is an operation in progress,
 * so then the app doesn't seem hung.
 */
class ConnectingPage extends PureComponent<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        return (
            <JitsiScreen style = { navigationStyles.connectingScreenContainer } >
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
    }
}


export default translate(ConnectingPage);
