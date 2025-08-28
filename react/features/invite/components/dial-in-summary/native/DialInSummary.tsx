import { Route } from '@react-navigation/native';
import React, { PureComponent } from 'react';
import { WithTranslation } from 'react-i18next';
import { Linking, View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { connect } from 'react-redux';

import { IStore } from '../../../../app/types';
import { openDialog } from '../../../../base/dialog/actions';
import { translate } from '../../../../base/i18n/functions';
import JitsiScreen from '../../../../base/modal/components/JitsiScreen';
import LoadingIndicator from '../../../../base/react/components/native/LoadingIndicator';
import { getDialInfoPageURLForURIString } from '../../../functions';

import DialInSummaryErrorDialog from './DialInSummaryErrorDialog';
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
    route: Route<'', { summaryUrl: string; }>;
}

/**
 * Implements a React native component that displays the dial in info page for a specific room.
 */
class DialInSummary extends PureComponent<IProps> {

    /**
     * Initializes a new instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._onError = this._onError.bind(this);
        this._onNavigate = this._onNavigate.bind(this);
        this._renderLoading = this._renderLoading.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately after mounting occurs.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentDidMount() {
        const { navigation, t } = this.props;

        navigation.setOptions({
            headerTitle: t('dialIn.screenTitle')
        });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    override render() {
        const { route } = this.props;
        const summaryUrl = route.params?.summaryUrl;

        return (
            <JitsiScreen
                style = { styles.backDrop }>
                <WebView
                    incognito = { true }
                    onError = { this._onError }
                    onShouldStartLoadWithRequest = { this._onNavigate }
                    renderLoading = { this._renderLoading }
                    setSupportMultipleWindows = { false }
                    source = {{ uri: getDialInfoPageURLForURIString(summaryUrl) ?? '' }}
                    startInLoadingState = { true }
                    style = { styles.webView }
                    webviewDebuggingEnabled = { true } />
            </JitsiScreen>
        );
    }

    /**
     * Callback to handle the error if the page fails to load.
     *
     * @returns {void}
     */
    _onError() {
        this.props.dispatch(openDialog(DialInSummaryErrorDialog));
    }

    /**
     * Callback to intercept navigation inside the webview and make the native app handle the dial requests.
     *
     * NOTE: We don't navigate to anywhere else form that view.
     *
     * @param {any} request - The request object.
     * @returns {boolean}
     */
    _onNavigate(request: { url: string; }) {
        const { url } = request;
        const { route } = this.props;
        const summaryUrl = route.params?.summaryUrl;

        if (url.startsWith('tel:')) {
            Linking.openURL(url);
        }

        return url === getDialInfoPageURLForURIString(summaryUrl);
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

export default translate(connect()(DialInSummary));
