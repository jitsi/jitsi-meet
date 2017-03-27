import React from 'react';

import { translate } from '../../base/i18n';

import AbstractPageReloadOverlay from './AbstractPageReloadOverlay';
import OverlayFrame from './OverlayFrame';

/**
 * Implements a React Component for page reload overlay. Shown before the
 * conference is reloaded. Shows a warning message and counts down towards the
 * reload.
 */
class PageReloadOverlay extends AbstractPageReloadOverlay {
    /**
     * PageReloadOverlay component's property types.
     *
     * @static
     */
    static propTypes = {
        ...AbstractPageReloadOverlay.propTypes,

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
        const { isNetworkFailure, t } = this.props;
        const { message, timeLeft, title } = this.state;

        return (
            <OverlayFrame isLightOverlay = { isNetworkFailure }>
                <div className = 'inlay'>
                    <span
                        className = 'reload_overlay_title'>
                        { t(title) }
                    </span>
                    <span className = 'reload_overlay_text'>
                        { t(message, { seconds: timeLeft }) }
                    </span>
                    { this._renderProgressBar() }
                    { this._renderButton() }
                </div>
            </OverlayFrame>
        );
    }
}

export default translate(PageReloadOverlay);
