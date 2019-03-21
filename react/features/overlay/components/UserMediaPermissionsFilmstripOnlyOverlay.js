import React from 'react';

import { translate, translateToHTML } from '../../base/i18n';
import { connect } from '../../base/redux';

import AbstractUserMediaPermissionsOverlay, { abstractMapStateToProps }
    from './AbstractUserMediaPermissionsOverlay';
import FilmstripOnlyOverlayFrame from './FilmstripOnlyOverlayFrame';

/**
 * Implements a React Component for overlay with guidance how to proceed with
 * gUM prompt. This component will be displayed only for filmstrip only mode.
 */
class UserMediaPermissionsFilmstripOnlyOverlay
    extends AbstractUserMediaPermissionsOverlay {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
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

export default translate(
    connect(abstractMapStateToProps)(UserMediaPermissionsFilmstripOnlyOverlay));
