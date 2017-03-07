import React from 'react';

import { translate } from '../../base/i18n';

import AbstractOverlay from './AbstractOverlay';

/**
 * Implements a React Component for suspended overlay. Shown when a suspend is
 * detected.
 */
class SuspendedOverlay extends AbstractOverlay {
    /**
     * Constructs overlay body with the message and a button to rejoin.
     *
     * @returns {ReactElement|null}
     * @override
     * @protected
     */
    _renderOverlayContent() {
        const btnClass = 'inlay__button button-control button-control_primary';
        const { t } = this.props;

        /* eslint-disable react/jsx-handler-names */

        return (
            <div className = 'inlay'>
                <span className = 'inlay__icon icon-microphone' />
                <span className = 'inlay__icon icon-camera' />
                <h3
                    className = 'inlay__title'>
                    { t('suspendedoverlay.title') }
                </h3>
                <button
                    className = { btnClass }
                    onClick = { this._reconnectNow }>
                    { t('suspendedoverlay.rejoinKeyTitle') }
                </button>
            </div>
        );

        /* eslint-enable react/jsx-handler-names */
    }
}

export default translate(SuspendedOverlay);
