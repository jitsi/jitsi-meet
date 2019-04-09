// @flow

import React from 'react';

import { translate, translateToHTML } from '../../../base/i18n';

import AbstractSuspendedOverlay from './AbstractSuspendedOverlay';
import FilmstripOnlyOverlayFrame from './FilmstripOnlyOverlayFrame';
import ReloadButton from './ReloadButton';

/**
 * Implements a React Component for suspended overlay for filmstrip only mode.
 * Shown when suspended is detected.
 */
class SuspendedFilmstripOnlyOverlay extends AbstractSuspendedOverlay {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        return (
            <FilmstripOnlyOverlayFrame isLightOverlay = { true }>
                <div className = 'inlay-filmstrip-only__container'>
                    <div className = 'inlay-filmstrip-only__title'>
                        { t('suspendedoverlay.title') }
                    </div>
                    <div className = 'inlay-filmstrip-only__text'>
                        { translateToHTML(t, 'suspendedoverlay.text') }
                    </div>
                </div>
                <ReloadButton textKey = 'suspendedoverlay.rejoinKeyTitle' />
            </FilmstripOnlyOverlayFrame>
        );
    }
}

export default translate(SuspendedFilmstripOnlyOverlay);
