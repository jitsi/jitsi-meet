import React, { Component } from 'react';

import { translate, translateToHTML } from '../../base/i18n';

import OverlayFrame from './OverlayFrame';
import ReloadButton from './ReloadButton';

/**
 * Implements a React Component for suspended overlay. Shown when a suspend is
 * detected.
 */
class SuspendedOverlay extends Component {
    /**
     * SuspendedOverlay component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The function to translate human-readable text.
         *
         * @public
         * @type {Function}
         */
        t: React.PropTypes.func
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     */
    render() {
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
                    <span className = 'inlay__text'>
                        {
                            translateToHTML(t, 'suspendedoverlay.title')
                        }
                    </span>
                    <ReloadButton
                        textKey = 'suspendedoverlay.rejoinKeyTitle' />
                </div>
            </OverlayFrame>
        );
    }
}

export default translate(SuspendedOverlay);
