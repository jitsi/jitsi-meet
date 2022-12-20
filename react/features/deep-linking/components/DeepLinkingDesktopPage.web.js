// @flow

import { AtlasKitThemeProvider } from '@atlaskit/theme';
import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { createDeepLinkingPageEvent, sendAnalytics } from '../../analytics';
import { IDeeplinkingConfig } from '../../base/config/configType';
import { isSupportedBrowser } from '../../base/environment';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import Button from '../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../base/ui/constants.web';
import {
    openDesktopApp,
    openWebApp
} from '../actions';
import { _TNS } from '../constants';

/**
 * The type of the React {@code Component} props of
 * {@link DeepLinkingDesktopPage}.
 */
type Props = {

    /**
     * The deeplinking config.
     */
    _deeplinkingCfg: IDeeplinkingConfig,

    /**
     * Used to dispatch actions from the buttons.
     */
    dispatch: Dispatch<any>,

    /**
     * Used to obtain translations.
     */
    t: Function
};

/**
 * React component representing the deep linking page.
 *
 * @class DeepLinkingDesktopPage
 */
class DeepLinkingDesktopPage<P : Props> extends Component<P> {
    /**
     * Initializes a new {@code DeepLinkingDesktopPage} instance.
     *
     * @param {Object} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: P) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onLaunchWeb = this._onLaunchWeb.bind(this);
        this._onTryAgain = this._onTryAgain.bind(this);
    }

    /**
     * Implements the Component's componentDidMount method.
     *
     * @inheritdoc
     */
    componentDidMount() {
        sendAnalytics(
            createDeepLinkingPageEvent(
                'displayed', 'DeepLinkingDesktop', { isMobileBrowser: false }));
    }

    /**
     * Renders the component.
     *
     * @returns {ReactElement}
     */
    render() {
        const { t, _deeplinkingCfg: { desktop = {}, hideLogo, showImage } } = this.props;
        const { appName } = desktop;
        const rightColumnStyle
            = showImage ? null : { width: '100%' };

        return (

            // Enabling light theme because of the color of the buttons.
            <AtlasKitThemeProvider mode = 'light'>
                <div className = 'deep-linking-desktop'>
                    <div className = 'header'>
                        {
                            hideLogo
                                ? null
                                : <img
                                    alt = { t('welcomepage.logo.logoDeepLinking') }
                                    className = 'logo'
                                    src = 'images/logo-deep-linking.png' />
                        }
                    </div>
                    <div className = 'content'>
                        {
                            showImage
                                ? <div className = 'leftColumn'>
                                    <div className = 'leftColumnContent'>
                                        <div className = 'image' />
                                    </div>
                                </div> : null
                        }
                        <div
                            className = 'rightColumn'
                            style = { rightColumnStyle }>
                            <div className = 'rightColumnContent'>
                                <h1 className = 'title'>
                                    {
                                        t(`${_TNS}.title`,
                                        { app: appName })
                                    }
                                </h1>
                                <p className = 'description'>
                                    {
                                        t(
                                            `${_TNS}.${isSupportedBrowser()
                                                ? 'description'
                                                : 'descriptionWithoutWeb'}`,
                                            { app: appName }
                                        )
                                    }
                                </p>
                                <div className = 'buttons'>
                                    <Button
                                        label = { t(`${_TNS}.tryAgainButton`) }
                                        onClick = { this._onTryAgain }
                                        type = { BUTTON_TYPES.SECONDARY } />
                                    {
                                        isSupportedBrowser()
                                                && <Button
                                                    label = { t(`${_TNS}.launchWebButton`) }
                                                    onClick = { this._onLaunchWeb }
                                                    type = { BUTTON_TYPES.SECONDARY } />
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AtlasKitThemeProvider>
        );
    }

    _onTryAgain: () => void;

    /**
     * Handles try again button clicks.
     *
     * @returns {void}
     */
    _onTryAgain() {
        sendAnalytics(
            createDeepLinkingPageEvent(
                'clicked', 'tryAgainButton', { isMobileBrowser: false }));
        this.props.dispatch(openDesktopApp());
    }

    _onLaunchWeb: () => void;

    /**
     * Handles launch web button clicks.
     *
     * @returns {void}
     */
    _onLaunchWeb() {
        sendAnalytics(
            createDeepLinkingPageEvent(
                'clicked', 'launchWebButton', { isMobileBrowser: false }));
        this.props.dispatch(openWebApp());
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code DeepLinkingDesktopPage} component.
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

export default translate(connect(_mapStateToProps)(DeepLinkingDesktopPage));
