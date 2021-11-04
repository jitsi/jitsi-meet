// @flow

import React, { PureComponent } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { translate } from '../../../base/i18n';
import { IconArrowBack } from '../../../base/icons';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { LoadingIndicator } from '../../../base/react';
import { connect } from '../../../base/redux';
import { goBack } from '../../../conference/components/native/ConferenceNavigationContainerRef';
import HeaderNavigationButton
    from '../../../conference/components/native/HeaderNavigationButton';
import { getSharedDocumentUrl } from '../../functions';

import styles, { INDICATOR_COLOR } from './styles';

/**
 * The type of the React {@code Component} props of {@code ShareDocument}.
 */
type Props = {

    /**
     * URL for the shared document.
     */
    _documentUrl: string,

    /**
     * Color schemed style of the header component.
     */
    _headerStyles: Object,

    /**
     * Default prop for navigation between screen components(React Navigation).
     */
    navigation: Object,

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * Implements a React native component that renders the shared document window.
 */
class SharedDocument extends PureComponent<Props> {
    /**
     * Instantiates a new instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._renderLoading = this._renderLoading.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately after this component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        const { navigation } = this.props;

        navigation.setOptions({
            headerLeft: () => (
                <HeaderNavigationButton
                    onPress = { goBack }
                    src = { IconArrowBack }
                    style = { styles.headerArrowBack } />
            )
        });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const { _documentUrl } = this.props;

        return (
            <JitsiScreen
                addHeaderHeightValue = { true }
                hasTabNavigator = { false }
                style = { styles.sharedDocContainer }>
                <WebView
                    renderLoading = { this._renderLoading }
                    source = {{ uri: _documentUrl }}
                    startInLoadingState = { true } />
            </JitsiScreen>
        );
    }

    _renderLoading: () => React$Component<any>;

    /**
     * Renders the loading indicator.
     *
     * @returns {React$Component<any>}
     */
    _renderLoading() {
        return (
            <View style = { styles.indicatorWrapper }>
                <LoadingIndicator
                    color = { INDICATOR_COLOR }
                    size = 'large' />
            </View>
        );
    }
}

/**
 * Maps (parts of) the redux state to {@link SharedDocument} React {@code Component} props.
 *
 * @param {Object} state - The redux store/state.
 * @private
 * @returns {Object}
 */
export function _mapStateToProps(state: Object) {
    const documentUrl = getSharedDocumentUrl(state);

    return {
        _documentUrl: documentUrl,
        _headerStyles: ColorSchemeRegistry.get(state, 'Header')
    };
}

export default translate(connect(_mapStateToProps)(SharedDocument));
