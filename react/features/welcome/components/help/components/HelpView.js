// @flow

import React, { PureComponent } from 'react';

import JitsiScreenWebView from '../../../../base/modal/components/JitsiScreenWebView';
import JitsiStatusBar from '../../../../base/modal/components/JitsiStatusBar';
import { connect } from '../../../../base/redux';
import { screen } from '../../../../conference/components/native/routes';
import { renderArrowBackButton } from '../../../../welcome/functions.native';


import styles from './styles';


const DEFAULT_HELP_CENTRE_URL = 'https://web-cdn.jitsi.net/faq/meet-faq.html';

type Props = {

    /**
     * The URL to display in the Help Centre.
     */
    _url: string,

    /**
     * Default prop for navigating between screen components(React Navigation).
     */
    navigation: Object
}

/**
 * Implements a page that renders the help content for the app.
 */
class HelpView extends PureComponent<Props> {
    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately after mounting occurs.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        const {
            navigation
        } = this.props;

        navigation.setOptions({
            headerLeft: () =>
                renderArrowBackButton(() =>
                    navigation.jumpTo(screen.welcome.main))
        });
    }

    /**
     * Implements {@code PureComponent#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <>
                <JitsiStatusBar />
                <JitsiScreenWebView
                    source = { this.props._url }
                    style = { styles.helpViewContainer } />
            </>
        );
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        _url: state['features/base/config'].helpCentreURL || DEFAULT_HELP_CENTRE_URL
    };
}

export default connect(_mapStateToProps)(HelpView);
