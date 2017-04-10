import React, { Component } from 'react';

import { translate, translateToHTML } from '../../base/i18n';

import FilmstripOnlyOverlayFrame from './FilmstripOnlyOverlayFrame';

/**
 * Implements a React Component for overlay with guidance how to proceed with
 * gUM prompt. This component will be displayed only for filmstrip only mode.
 */
class UserMediaPermissionsFilmstripOnlyOverlay extends Component {
    /**
     * UserMediaPermissionsFilmstripOnlyOverlay component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The browser which is used currently. The text is different for every
         * browser.
         *
         * @public
         * @type {string}
         */
        browser: React.PropTypes.string,

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
        const textKey = `userMedia.${this.props.browser}GrantPermissions`;

        return (
            <FilmstripOnlyOverlayFrame
                icon = 'icon-mic-camera-combined'
                isLightOverlay = { true }>
                <div className = 'inlay-filmstrip-only__container'>
                    <div className = 'inlay-filmstrip-only__title'>
                        {
                            t('startupoverlay.title',
                                { postProcess: 'resolveAppName' })
                        }
                    </div>
                    <div className = 'inlay-filmstrip-only__text'>
                        {
                            translateToHTML(t, textKey)
                        }
                    </div>
                </div>
            </FilmstripOnlyOverlayFrame>
        );
    }
}

export default translate(UserMediaPermissionsFilmstripOnlyOverlay);
