import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../../app/types';
import { isVpaasMeeting } from '../../../../jaas/functions';

/**
 * The CSS style of the element with CSS class {@code rightwatermark}.
 *
 * @private
 */
const _RIGHT_WATERMARK_STYLE = {
    backgroundImage: 'url(images/rightwatermark.png)'
};

const useStyles = makeStyles()(theme => {
    return {
        container: {
            '@media (min-width: 720px)': {
                display: 'none'
            }
        },

        inToolbar: {
            position: 'relative',

            '.watermark': {
                position: 'relative',
                top: theme.spacing(2),
                left: theme.spacing(3)
            }
        }
    };
});

/**
 * The type of the React {@code Component} props of {@link Watermarks}.
 */
interface IProps {

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
     * Whether or not the component is in the toolbar.
     */
    inToolbar?: boolean;

    /**
     * Whether the watermark should have a `top` and `left` value.
     */
    noMargins: boolean;

    /**
     * Whether or not the component is on the welcome page.
     */
    welcomePage?: boolean;
}

const Watermarks = ({
    _logoLink,
    _logoUrl,
    _showJitsiWatermark,
    inToolbar,
    noMargins,
    welcomePage
}: IProps) => {
    const showBrandWatermark = useRef(interfaceConfig.SHOW_BRAND_WATERMARK);
    const brandWatermarkLink = useRef(showBrandWatermark ? interfaceConfig.BRAND_WATERMARK_LINK : '');
    const showPoweredBy = useRef(interfaceConfig.SHOW_POWERED_BY);
    const { t } = useTranslation();
    const { classes, cx } = useStyles();

    /**
     * Renders a Jitsi watermark if it is enabled.
     *
     * @private
     * @returns {ReactElement|null}
     */
    function _renderJitsiWatermark() {
        const className = `watermark ${noMargins ? 'leftwatermarknomargin' : 'leftwatermark'}`;

        let reactElement = null;

        if (_showJitsiWatermark) {
            const style = {
                backgroundImage: `url(${_logoUrl})`,
                maxWidth: 140,
                maxHeight: 70,
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
                        {reactElement}
                    </a>
                );
            }
        }

        return reactElement;
    }

    /**
     * Renders a brand watermark if it is enabled.
     *
     * @private
     * @returns {ReactElement|null} Watermark element or null.
     */
    function _renderBrandWatermark() {
        let reactElement = null;

        if (showBrandWatermark.current) {
            reactElement = (
                <div
                    className = 'watermark rightwatermark'
                    style = { _RIGHT_WATERMARK_STYLE } />
            );

            if (brandWatermarkLink.current) {
                reactElement = (
                    <a
                        href = { brandWatermarkLink.current }
                        target = '_new'>
                        {reactElement}
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
    function _renderPoweredBy() {
        if (showPoweredBy.current) {
            return (
                <a
                    className = 'poweredby'
                    href = 'http://jitsi.org'
                    target = '_new'>
                    <span>{t('poweredby')} jitsi.org</span>
                </a>
            );
        }

        return null;
    }

    return (
        <div
            className = { cx('watermark-container', !inToolbar && !welcomePage && classes.container,
                inToolbar && classes.inToolbar) }>
            {
                _renderJitsiWatermark()
            }
            {
                _renderBrandWatermark()
            }
            {
                _renderPoweredBy()
            }
        </div>
    );
};

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

export default connect(_mapStateToProps)(Watermarks);
