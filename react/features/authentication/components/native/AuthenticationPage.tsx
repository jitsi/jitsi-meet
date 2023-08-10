import { Route } from '@react-navigation/native';
import React  from 'react';
import { WithTranslation } from 'react-i18next';
import { View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import LoadingIndicator from '../../../base/react/components/native/LoadingIndicator';

import styles, { INDICATOR_COLOR } from './styles';


interface IProps extends WithTranslation {

    /**
     * Default prop for navigating between screen components(React Navigation).
     */
    route: Route<'', { tokenAuthServiceUrl: string; }>;
}

const AuthenticationPage: React.FunctionComponent<IProps> = ({ route }: IProps) => {
    const tokenAuthServiceUrl = route.params?.tokenAuthServiceUrl;
    const renderLoading = () => (
        <View style = { styles.indicatorWrapper as ViewStyle }>
            <LoadingIndicator
                color = { INDICATOR_COLOR }
                size = 'large' />
        </View>
    );

    return (
        <JitsiScreen
            style = { styles.backDrop }>
            <WebView
                renderLoading = { renderLoading }
                setSupportMultipleWindows = { false }
                source = {{ uri: tokenAuthServiceUrl }}
                startInLoadingState = { true }
                style = { styles.webView } />
        </JitsiScreen>
    )
}

export default AuthenticationPage;
