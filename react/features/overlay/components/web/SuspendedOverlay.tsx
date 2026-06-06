import React from 'react';

import { translate } from '../../../base/i18n/functions';

import AbstractSuspendedOverlay from './AbstractSuspendedOverlay';
import OverlayFrame from './OverlayFrame';
import ReloadButton from './ReloadButton';

/**
 * Implements a React Component for suspended overlay. Shown when a suspend is
 * detected.
 */
class SuspendedOverlay extends AbstractSuspendedOverlay {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const { t } = this.props;

        return (
            <OverlayFrame>
                <div className = 'inlay'>
                    <span className = 'inlay__icon icon-microphone' />
                    <span className = 'inlay__icon icon-camera' />
                    <h3
                        className = 'inlay__title'>
                        { t('suspendedoverlay.title') }
                    </h3>
                    <ReloadButton textKey = 'suspendedoverlay.rejoinKeyTitle' />
                </div>
            </OverlayFrame>
        );
    }
}

export default translate(SuspendedOverlay);
