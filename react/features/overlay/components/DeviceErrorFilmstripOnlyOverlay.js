import AKButton from '@atlaskit/button';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { JitsiTrackErrors } from '../../base/lib-jitsi-meet';

import { clearDeviceErrors } from '../actions';

import FilmstripOnlyOverlayFrame from './FilmstripOnlyOverlayFrame';

/**
 * React {@code Component} for an overlay informing an error occurred while
 * attempting to use a camera and/or microphone. This component will be
 * displayed only for filmstrip only mode. Due to space limitations, verbose
 * error messaging is not displayed.
 *
 * @extends Component
 */
class DeviceErrorFilmstripOnlyOverlay extends Component {
    /**
     * {@code DeviceErrorFilmstripOnlyOverlay}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The JitsiTrackError returned from failing to use a camera.
         *
         * @type {JitsiTrackError}
         */
        cameraError: React.PropTypes.object,

        /**
         * Invoked to clear known device errors.
         */
        dispatch: React.PropTypes.func,

        /**
         * The JitsiTrackError returned from failing to use a microphone.
         *
         * @type {JitsiTrackError}
         */
        micError: React.PropTypes.object,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    }

    /**
     * Initializes a new {@code DeviceErrorFilmstripOnlyOverlay} instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onDismiss = this._onDismiss.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <FilmstripOnlyOverlayFrame
                isLightOverlay = { true }>
                <div className = 'inlay-filmstrip-only__container'>
                    <div className = 'inlay-filmstrip-only__title'>
                        { this.props.t(this._getTitleKey()) }
                    </div>
                    <div className = 'inlay-filmstrip-only__text'>
                        <div>
                            { this.props.cameraError
                                && this.props.t('dialog.cameraErrorPresent') }
                        </div>
                        <div>
                            { this.props.micError
                                && this.props.t('dialog.micErrorPresent') }
                        </div>
                    </div>
                    <AKButton
                        appearance = 'primary'
                        onClick = { this._onDismiss }>
                        { this.props.t('dialog.Ok') }
                    </AKButton>
                </div>
            </FilmstripOnlyOverlayFrame>
        );
    }

    /**
     * Determines which translation key should be used as the overlay's title
     * based on the types of errors present.
     *
     * @private
     * @returns {string} The translation key to use as an overlay title.
     */
    _getTitleKey() {
        const { cameraError, micError } = this.props;
        const { PERMISSION_DENIED } = JitsiTrackErrors;

        let title = 'dialog.error';

        if (micError && micError.name === PERMISSION_DENIED) {
            if (!cameraError || cameraError.name === PERMISSION_DENIED) {
                title = 'dialog.permissionDenied';
            }
        } else if (cameraError && cameraError.name === PERMISSION_DENIED) {
            title = 'dialog.permissionDenied';
        }

        return title;
    }

    /**
     * Dispatches an action to clear device error messages to hide the error
     * overlay.
     *
     * @private
     * @returns {void}
     */
    _onDismiss() {
        this.props.dispatch(clearDeviceErrors());
    }
}

export default translate(connect()(DeviceErrorFilmstripOnlyOverlay));
