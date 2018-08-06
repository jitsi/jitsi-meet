/* @flow */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../i18n';

declare var interfaceConfig: Object;

/**
 * The CSS style of the element with CSS class {@code rightwatermark}.
 *
 * @private
 */
const _RIGHT_WATERMARK_STYLE = {
    backgroundImage: 'url(images/rightwatermark.png)'
};

/**
 * A Web Component which renders watermarks such as Jits, brand, powered by,
 * etc.
 */
class Watermarks extends Component<*, *> {
    static propTypes = {
        _isGuest: PropTypes.bool,
        t: PropTypes.func
    };

    state = {
        brandWatermarkLink: String,
        jitsiWatermarkLink: String,
        showBrandWatermark: Boolean,
        showJitsiWatermark: Boolean,
        showJitsiWatermarkForGuests: Boolean,
        showPoweredBy: Boolean
    };

    /**
     * Initializes a new Watermarks instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Object) {
        super(props);

        let showBrandWatermark;
        let showJitsiWatermark;
        let showJitsiWatermarkForGuests;

        if (interfaceConfig.filmStripOnly) {
            showBrandWatermark = false;
            showJitsiWatermark = false;
            showJitsiWatermarkForGuests = false;
        } else {
            showBrandWatermark = interfaceConfig.SHOW_BRAND_WATERMARK;
            showJitsiWatermark = interfaceConfig.SHOW_JITSI_WATERMARK;
            showJitsiWatermarkForGuests
                = interfaceConfig.SHOW_WATERMARK_FOR_GUESTS;
        }

        this.state = {
            brandWatermarkLink:
                showBrandWatermark ? interfaceConfig.BRAND_WATERMARK_LINK : '',
            jitsiWatermarkLink:
                showJitsiWatermark || showJitsiWatermarkForGuests
                    ? interfaceConfig.JITSI_WATERMARK_LINK : '',
            showBrandWatermark,
            showJitsiWatermark,
            showJitsiWatermarkForGuests,
            showPoweredBy: interfaceConfig.SHOW_POWERED_BY
        };
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
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
        let reactElement = null;

        if (this.state.showJitsiWatermark
                || (this.props._isGuest
                    && this.state.showJitsiWatermarkForGuests)) {
            reactElement = <div className = 'watermark leftwatermark' />;

            const { jitsiWatermarkLink } = this.state;

            if (jitsiWatermarkLink) {
                reactElement = (
                    <a
                        href = { jitsiWatermarkLink }
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
 * @returns {{
 *      _isGuest: boolean
 * }}
 */
function _mapStateToProps(state) {
    const { isGuest } = state['features/base/jwt'];

    return {
        /**
         * The indicator which determines whether the local participant is a
         * guest in the conference.
         *
         * @private
         * @type {boolean}
         */
        _isGuest: isGuest
    };
}

export default connect(_mapStateToProps)(translate(Watermarks));
