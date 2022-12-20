/* @flow */

import React, { Component } from 'react';

import { createDeepLinkingPageEvent, sendAnalytics } from '../../analytics';
import { IDeeplinkingConfig } from '../../base/config/configType';
import { connect } from '../../base/redux';


/**
 * The type of the React {@code Component} props of
 * {@link NoMobileApp}.
 */
type Props = {

    /**
     * The deeplinking config.
     */
    _deeplinkingCfg: IDeeplinkingConfig,
};

/**
 * React component representing no mobile app page.
 *
 * @class NoMobileApp
 */
class NoMobileApp<P : Props> extends Component<P> {
    /**
     * Implements the Component's componentDidMount method.
     *
     * @inheritdoc
     */
    componentDidMount() {
        sendAnalytics(
            createDeepLinkingPageEvent(
                'displayed', 'noMobileApp', { isMobileBrowser: true }));
    }

    /**
     * Renders the component.
     *
     * @returns {ReactElement}
     */
    render() {
        const ns = 'no-mobile-app';
        const { desktop: { appName } } = this.props._deeplinkingCfg;

        return (
            <div className = { ns }>
                <h2 className = { `${ns}__title` }>
                    Video chat isn't available on mobile.
                </h2>
                <p className = { `${ns}__description` }>
                    Please use { appName } on desktop to
                    join calls.
                </p>
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code NoMobileApp} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        _deeplinkingCfg: state['features/base/config'].deeplinking || {}
    };
}

export default connect(_mapStateToProps)(NoMobileApp);
