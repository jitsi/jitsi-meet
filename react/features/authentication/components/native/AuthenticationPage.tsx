import { Route } from '@react-navigation/native';
import React, { PureComponent } from 'react';
import { WithTranslation } from 'react-i18next';
import { View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { connect } from 'react-redux';

import { IStore } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import LoadingIndicator from '../../../base/react/components/native/LoadingIndicator';

import styles, { INDICATOR_COLOR } from './styles';


interface IProps extends WithTranslation {

    dispatch: IStore['dispatch'];

    /**
     * Default prop for navigating between screen components(React Navigation).
     */
    navigation: any;

    /**
     * Default prop for navigating between screen components(React Navigation).
     */
    route: Route<'', { tokenAuthServiceUrl: string; }>;
}

/**
 * Implements a React native component that displays the authentication page for a specific room.
 */
class AuthenticationPage extends PureComponent<IProps> {

    /**
     * Initializes a new instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._renderLoading = this._renderLoading.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const { route } = this.props;
        const tokenAuthServiceUrl = route.params?.tokenAuthServiceUrl;

        return (
            <JitsiScreen
                style = { styles.backDrop }>
                <WebView
                    renderLoading = { this._renderLoading }
                    setSupportMultipleWindows = { false }
                    source = {{ uri: tokenAuthServiceUrl }}
                    startInLoadingState = { true }
                    style = { styles.webView } />
            </JitsiScreen>
        );
    }

    /**
     * Renders the loading indicator.
     *
     * @returns {React$Component<any>}
     */
    _renderLoading() {
        return (
            <View style = { styles.indicatorWrapper as ViewStyle }>
                <LoadingIndicator
                    color = { INDICATOR_COLOR }
                    size = 'large' />
            </View>
        );
    }
}

export default translate(connect()(AuthenticationPage));
