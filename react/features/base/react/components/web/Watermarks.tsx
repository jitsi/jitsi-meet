import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import { isVpaasMeeting } from '../../../../jaas/functions';
import { translate } from '../../../i18n/functions';

/**
 * The CSS style of the element with CSS class {@code rightwatermark}.
 *
 * @private
 */
const _RIGHT_WATERMARK_STYLE = {
    backgroundImage: 'url(images/rightwatermark.png)'
};

/**
 * The type of the React {@code Component} props of {@link Watermarks}.
 */
interface IProps extends WithTranslation {

    /**
     * The link used to navigate to on logo click.
     */
    _logoLink: string;

    /**
     * The url for the logo.
     */
    _logoUrl?: string;

    /**
     * If the Jitsi watermark should be displayed or not.
     */
    _showJitsiWatermark: boolean;

    /**
     * The default value for the Jitsi logo URL.
     */
    defaultJitsiLogoURL?: string;

    /**
     * Whether the watermark should have a `top` and `left` value.
     */
    noMargins: boolean;
}

/**
 * The type of the React {@code Component} state of {@link Watermarks}.
 */
type State = {

    /**
     * The url to open when clicking the brand watermark.
     */
    brandWatermarkLink: string;

    /**
     * Whether or not the brand watermark should be displayed.
     */
    showBrandWatermark: boolean;

    /**
     * Whether or not the show the "powered by Jitsi.org" link.
     */
    showPoweredBy: boolean;
};

/**
 * A Web Component which renders watermarks such as Jits, brand, powered by,
 * etc.
 */
class Watermarks extends Component<IProps, State> {
    /**
     * Initializes a new Watermarks instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        const showBrandWatermark = interfaceConfig.SHOW_BRAND_WATERMARK;

        this.state = {
            brandWatermarkLink:
                showBrandWatermark ? interfaceConfig.BRAND_WATERMARK_LINK : '',
            showBrandWatermark,
            showPoweredBy: interfaceConfig.SHOW_POWERED_BY
        };
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        return (
            <div>
                {
                    this._renderJitsiWatermark()
                }
                {
                    this._renderBrandWatermark()
                }
                {
                    this._renderPoweredBy()
                }
            </div>
        );
    }

    /**
     * Renders a brand watermark if it is enabled.
     *
     * @private
     * @returns {ReactElement|null} Watermark element or null.
     */
    _renderBrandWatermark() {
        let reactElement = null;

        if (this.state.showBrandWatermark) {
            reactElement = (
                <div
                    className = 'watermark rightwatermark'
                    style = { _RIGHT_WATERMARK_STYLE } />
            );

            const { brandWatermarkLink } = this.state;

            if (brandWatermarkLink) {
                reactElement = (
                    <a
                        href = { brandWatermarkLink }
                        target = '_new'>
                        { reactElement }
                    </a>
                );
            }
        }

        return reactElement;
    }

    /**
     * Renders a Jitsi watermark if it is enabled.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderJitsiWatermark() {
        const {
            _logoLink,
            _logoUrl,
            _showJitsiWatermark
        } = this.props;
        const { noMargins, t } = this.props;
        const className = `watermark leftwatermark ${noMargins ? 'no-margin' : ''}`;

        let reactElement = null;

        if (_showJitsiWatermark) {
            const style = {
                backgroundImage: `url(${_logoUrl})`,
                position: _logoLink ? 'static' : 'absolute'
            } as const;

            reactElement = (<div
                className = { className }
                style = { style } />);

            if (_logoLink) {
                reactElement = (
                    <a
                        aria-label = { t('jitsiHome', { logo: interfaceConfig.APP_NAME }) }
                        className = { className }
                        href = { _logoLink }
                        target = '_new'>
                        { reactElement }
                    </a>
                );
            }
        }

        return reactElement;
    }

    /**
     * Renders a powered by block if it is enabled.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderPoweredBy() {
        if (this.state.showPoweredBy) {
            const { t } = this.props;

            return (
                <a
                    className = 'poweredby'
                    href = 'http://jitsi.org'
                    target = '_new'>
                    <span>{ t('poweredby') } jitsi.org</span>
                </a>
            );
        }

        return null;
    }
}

/**
 * Maps parts of Redux store to component prop types.
 *
 * @param {Object} state - Snapshot of Redux store.
 * @param {Object} ownProps - Component's own props.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const {
        customizationReady,
        customizationFailed,
        defaultBranding,
        useDynamicBrandingData,
        logoClickUrl,
        logoImageUrl
    } = state['features/dynamic-branding'];
    const isValidRoom = state['features/base/conference'].room;
    const { defaultLogoUrl } = state['features/base/config'];
    const {
        JITSI_WATERMARK_LINK,
        SHOW_JITSI_WATERMARK
    } = interfaceConfig;
    let _showJitsiWatermark = (
        customizationReady && !customizationFailed
        && SHOW_JITSI_WATERMARK)
    || !isValidRoom;
    let _logoUrl: string | undefined = logoImageUrl;
    let _logoLink = logoClickUrl;

    if (useDynamicBrandingData) {
        if (isVpaasMeeting(state)) {
            // don't show logo if request fails or no logo set for vpaas meetings
            _showJitsiWatermark = !customizationFailed && Boolean(logoImageUrl);
        } else if (defaultBranding) {
            _logoUrl = defaultLogoUrl;
            _logoLink = JITSI_WATERMARK_LINK;
        }
    } else {
        // When there is no custom branding data use defaults
        _logoUrl = ownProps.defaultJitsiLogoURL || defaultLogoUrl;
        _logoLink = JITSI_WATERMARK_LINK;
    }

    return {
        _logoLink,
        _logoUrl,
        _showJitsiWatermark
    };
}

export default translate(connect(_mapStateToProps)(Watermarks));
