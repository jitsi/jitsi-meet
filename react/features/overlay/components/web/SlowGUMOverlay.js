// @flow
import Spinner from '@atlaskit/spinner';
import React from 'react';

import { translate } from '../../../base/i18n';

import AbstractSlowGUMOverlay from './AbstractSlowGUMOverlay';
import OverlayFrame from './OverlayFrame';

/**
 * Implements a React {@link Component} for slow gUM overlay. Shown when
 * a slow gUM promise resolution is detected
 */
class SlowGUMOverlay extends AbstractSlowGUMOverlay {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        // const { t } = this.props;

        return (
            <OverlayFrame>
                <div className = { 'overlay__spinner-container' }>
                    <Spinner
                        invertColor = { true }
                        size = { 'large' } />
                </div>
            </OverlayFrame>
        );
    }
}

export default translate(SlowGUMOverlay);
