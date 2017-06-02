import React, { Component } from 'react';

import { translate, translateToHTML } from '../../base/i18n';

import FilmstripOnlyOverlayFrame from './FilmstripOnlyOverlayFrame';
import ReloadButton from './ReloadButton';

/**
 * Implements a React Component for suspended overlay for filmstrip only mode.
 * Shown when suspended is detected.
 */
class SuspendedFilmstripOnlyOverlay extends Component {
    /**
     * SuspendedFilmstripOnlyOverlay component's property types.
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
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
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
