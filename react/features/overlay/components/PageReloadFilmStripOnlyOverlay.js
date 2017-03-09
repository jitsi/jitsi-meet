import React from 'react';

import { translate } from '../../base/i18n';

import AbstractPageReloadOverlay from './AbstractPageReloadOverlay';
import FilmStripOnlyOverlayFrame from './FilmStripOnlyOverlayFrame';

/**
 * Implements a React Component for page reload overlay for filmstrip only
 * mode. Shown before the conference is reloaded. Shows a warning message and
 * counts down towards the reload.
 */
class PageReloadFilmStripOnlyOverlay extends AbstractPageReloadOverlay {
    /**
     * PageReloadFilmStripOnlyOverlay component's property types.
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
        const { t } = this.props;
        const { message, timeLeft, title } = this.state;

        return (
            <FilmStripOnlyOverlayFrame>
                <div className = 'inlay-filmstrip-only__container'>
                    <div className = 'inlay-filmstrip-only__title'>
                        { t(title) }
                    </div>
                    <div className = 'inlay-filmstrip-only__text'>
                        { t(message, { seconds: timeLeft }) }
                    </div>
                </div>
                {
                    this._renderButton()
                }
                {
                    this._renderProgressBar()
                }
            </FilmStripOnlyOverlayFrame>
        );
    }
}

export default translate(PageReloadFilmStripOnlyOverlay);
