// @flow
import React, { PureComponent } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

import { i18next, DEFAULT_LANGUAGE } from '../../base/i18n';
import { IconArrowBack } from '../../base/icons';
import JitsiScreen from '../../base/modal/components/JitsiScreen';
import { LoadingIndicator } from '../../base/react';
import { connect } from '../../base/redux';
import { ColorPalette } from '../../base/styles';
import HeaderNavigationButton
    from '../../mobile/navigation/components/HeaderNavigationButton';
import { goBack } from '../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { getGenericiFrameUrl } from '../functions';

export const INDICATOR_COLOR = ColorPalette.lightGrey;

const styles = {
    webView: {
        flex: 1
    },
    view: {
        alignItems: 'center',
        backgroundColor: ColorPalette.white,
        height: '100%',
        justifyContent: 'center'
    }
};


type Props = {

    /**
     * The current shared iframe state.
     *
     * @private
     */
     _sharedIFrames: Object,

    /**
     * The current users room.
     *
     * @private
     */
    _room: string,

     /**
     * The current users language setting.
     *
     * @private
     */
     _lang: string,

    /**
     * Default prop for navigation between screen components(React Navigation).
     */
    navigation: Object,

    /**
     * Route Attributes.
     */
    route: Object,
}

/** .
 * Implements a React {@link Component} which represents the large video (a.k.a.
 * The conference participant who is on the local stage) on Web/React.
 *
 * @augments Component
 */
class SharedIFrame extends PureComponent<Props> {

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
                    src = { IconArrowBack } />
            )
        });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const { _sharedIFrames, _room, _lang, route } = this.props;

        return (
            <JitsiScreen
                addHeaderHeightValue = { true }
                style = { styles.screen }>
                <WebView
                    renderLoading = { this._renderLoading }
                    source = {{
                        uri: getGenericiFrameUrl(_sharedIFrames[route.params.key].iFrameTemplateUrl, _room, _lang) }}
                    startInLoadingState = { true } />
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
            <View style = { styles.view }>
                <LoadingIndicator
                    color = { INDICATOR_COLOR }
                    size = 'large' />
            </View>
        );
    }
}


/**
 * Maps (parts of) the Redux state to the associated LargeVideo props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const sharedIFrames = state['features/shared-iframe'].iframes || {};
    const { room } = state['features/base/conference'];
    const lang = i18next.language || DEFAULT_LANGUAGE;

    return {
        _sharedIFrames: sharedIFrames,
        _room: room,
        _lang: lang
    };
}

export default connect(_mapStateToProps)(SharedIFrame);
