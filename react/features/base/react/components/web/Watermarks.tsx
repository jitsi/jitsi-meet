import React, { Component } from "react";
import { WithTranslation } from "react-i18next";
import { connect } from "react-redux";

import { IReduxState } from "../../../../app/types";
import { isVpaasMeeting } from "../../../../jaas/functions";
import { translate } from "../../../i18n/functions";
// import { back } from "react-emoji-render/data/aliases";

/**
 * The CSS style of the element with CSS class {@code rightwatermark}.
 *
 * @private
 */
const _RIGHT_WATERMARK_STYLE = {
    backgroundImage: "url(images/rightwatermark.png)",
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

    /**
     * Whether to show background styling on the logo.
     */
    showLogoBackground?: boolean;
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
            brandWatermarkLink: showBrandWatermark ? interfaceConfig.BRAND_WATERMARK_LINK : "",
            showBrandWatermark,
            showPoweredBy: interfaceConfig.SHOW_POWERED_BY,
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
                {this._renderJitsiWatermark()}
                {this._renderBrandWatermark()}
                {this._renderPoweredBy()}
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
            reactElement = <div className="watermark rightwatermark" style={_RIGHT_WATERMARK_STYLE} />;

            const { brandWatermarkLink } = this.state;

            if (brandWatermarkLink) {
                reactElement = (
                    <a href={brandWatermarkLink} target="_new">
                        {reactElement}
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
        const { _logoLink, _logoUrl, _showJitsiWatermark, showLogoBackground } = this.props;
        const { noMargins, t } = this.props;
        const className = `watermark leftwatermark ${noMargins ? "no-margin" : ""}`;

        let reactElement = null;

        if (_showJitsiWatermark) {
            if (showLogoBackground) {
                // Full-width background bar using absolute positioning
                const fullWidthBarStyle = {
                    position: "absolute",
                    top: "0",
                    left: "0",
                    width: "100vw",
                    height: "100px",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    borderBottom: "1px solid rgba(255,255,255,0.2)",
                    zIndex: "10",
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: "20px",
                    pointerEvents: "none",
                } as const;

                const logoStyle = {
                    backgroundImage: `url(${"images/logoContent1.png"})`,
                    width: "180px",
                    height: "80px",
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    pointerEvents: "auto",
                } as const;

                reactElement = (
                    <div>
                        <div style={fullWidthBarStyle}>
                            <div style={logoStyle} />
                        </div>
                    </div>
                );

                if (_logoLink) {
                    reactElement = (
                        <div>
                            <div style={fullWidthBarStyle}>
                                <a
                                    aria-label={t("jitsiHome", { logo: interfaceConfig.APP_NAME })}
                                    href={"http://multiaccess.io"}
                                    target="_new"
                                    style={{ textDecoration: "none", pointerEvents: "auto" }}
                                >
                                    <div style={logoStyle} />
                                </a>
                            </div>
                        </div>
                    );
                }
            } else {
                // Regular logo without background
                const baseStyle = {
                    backgroundImage: `url(${"images/logoContent1.png"})`,
                    position: _logoLink ? "static" : "absolute",
                    width: "180px",
                    height: "80px",
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                } as const;

                reactElement = <div className={className} style={baseStyle} />;

                if (_logoLink) {
                    reactElement = (
                        <a
                            aria-label={t("jitsiHome", { logo: interfaceConfig.APP_NAME })}
                            className={className}
                            href={"http://multiaccess.io"}
                            target="_new"
                        >
                            {reactElement}
                        </a>
                    );
                }
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
                <a className="poweredby" href="http://multiaccess.io" target="_new">
                    <span>{t("poweredby")} multiaccess.io</span>
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
// function _mapStateToProps(state: IReduxState, ownProps: any) {
//     const {
//         customizationReady,
//         customizationFailed,
//         defaultBranding,
//         useDynamicBrandingData,
//         logoClickUrl,
//         logoImageUrl,
//     } = state["features/dynamic-branding"];
//     const isValidRoom = state["features/base/conference"].room;
//     const { defaultLogoUrl } = state["features/base/config"];
//     const { JITSI_WATERMARK_LINK, SHOW_JITSI_WATERMARK } = interfaceConfig;
//     let _showJitsiWatermark = (customizationReady && !customizationFailed && SHOW_JITSI_WATERMARK) || !isValidRoom;
//     let _logoUrl: string | undefined = logoImageUrl;
//     let _logoLink = logoClickUrl;

//     if (useDynamicBrandingData) {
//         if (isVpaasMeeting(state)) {
//             // don't show logo if request fails or no logo set for vpaas meetings
//             _showJitsiWatermark = !customizationFailed && Boolean(logoImageUrl);
//         } else if (defaultBranding) {
//             _logoUrl = defaultLogoUrl;
//             _logoLink = JITSI_WATERMARK_LINK;
//         }
//     } else {
//         // When there is no custom branding data use defaults
//         _logoUrl = ownProps.defaultJitsiLogoURL || defaultLogoUrl;
//         _logoLink = JITSI_WATERMARK_LINK;
//         console.log("watermark", _logoLink);
//     }

//     return {
//         _logoLink,
//         _logoUrl,
//         _showJitsiWatermark,
//     };
// }
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const { JITSI_WATERMARK_LINK, SHOW_JITSI_WATERMARK, DEFAULT_WELCOME_PAGE_LOGO_URL } = interfaceConfig;
    return {
        _logoLink: JITSI_WATERMARK_LINK,
        _logoUrl: DEFAULT_WELCOME_PAGE_LOGO_URL,
        _showJitsiWatermark: SHOW_JITSI_WATERMARK,
    };
}
export default translate(connect(_mapStateToProps)(Watermarks));
