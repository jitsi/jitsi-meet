// @flow

import React from 'react';

import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractPageReloadOverlay, {
    abstractMapStateToProps,
    type Props
} from '../AbstractPageReloadOverlay';

import OverlayFrame from './OverlayFrame';

/**
 * Implements a React Component for page reload overlay. Shown before the
 * conference is reloaded. Shows a warning message and counts down towards the
 * reload.
 */
class PageReloadOverlay extends AbstractPageReloadOverlay<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { isNetworkFailure, t } = this.props;
        const { message, timeLeft, title } = this.state;

        return (
            <OverlayFrame isLightOverlay = { isNetworkFailure }>
                <div
                    aria-describedby = 'reload_overlay_text'
                    aria-labelledby = 'reload_overlay_title'
                    className = 'inlay'
                    role = 'dialog'>
                    <span
                        className = 'reload_overlay_title'
                        id = 'reload_overlay_title'
                        role = 'heading'>
                        { t(title) }
                    </span>
                    <span
                        className = 'reload_overlay_text'
                        id = 'reload_overlay_text'>
                        { t(message, { seconds: timeLeft }) }
                    </span>
                    { this._renderProgressBar() }
                    { this._renderButton() }
                </div>
            </OverlayFrame>
        );
    }

    _renderButton: () => React$Element<*>;

    _renderProgressBar: () => React$Element<*>;
}

export default translate(connect(abstractMapStateToProps)(PageReloadOverlay));
