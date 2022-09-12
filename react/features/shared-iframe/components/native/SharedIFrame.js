import React, { PureComponent } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

import { IconArrowBack } from '../../../base/icons';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { LoadingIndicator } from '../../../base/react';
import { connect } from '../../../base/redux';
import { ColorPalette } from '../../../base/styles';
import HeaderNavigationButton
    from '../../../mobile/navigation/components/HeaderNavigationButton';
import { goBack } from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';

export const INDICATOR_COLOR = ColorPalette.lightGrey;

const styles = {
    screen: {
        flexDirection: 'column',
        flex: 1,
        height: 'auto'
    },
    iframe: {
        zIndex: 1,
        userSelect: 'auto'
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
        const { route } = this.props;

        return (
            <JitsiScreen
                addHeaderHeightValue = { true }
                style = { styles.screen }>
                <WebView
                    renderLoading = { this._renderLoading }
                    source = {{
                        uri: route.params?.templateUrl
                    }}
                    startInLoadingState = { true }
                    style = { styles.iframe } />
            </JitsiScreen>
        );
    }

    /**
     * Renders the loading indicator.
     *
     * @returns {React$Component<any>}.
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

export default connect()(SharedIFrame);
