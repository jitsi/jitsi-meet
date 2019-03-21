/* global interfaceConfig */

import React from 'react';

import { translate, translateToHTML } from '../../base/i18n';
import { connect } from '../../base/redux';

import AbstractUserMediaPermissionsOverlay, { abstractMapStateToProps }
    from './AbstractUserMediaPermissionsOverlay';
import OverlayFrame from './OverlayFrame';

/**
 * Implements a React Component for overlay with guidance how to proceed with
 * gUM prompt.
 */
class UserMediaPermissionsOverlay extends AbstractUserMediaPermissionsOverlay {
    /**
     * Initializes a new UserMediaPermissionsOverlay instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     * @public
     */
    constructor(props) {
        super(props);

        this.state = {
            /**
             * The src value of the image for the policy logo.
             *
             * @type {string}
             */
            policyLogoSrc: interfaceConfig.POLICY_LOGO
        };
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { browser, t } = this.props;

        return (
            <OverlayFrame>
                <div className = 'inlay'>
                    <span className = 'inlay__icon icon-microphone' />
                    <span className = 'inlay__icon icon-camera' />
                    <h3 className = 'inlay__title'>
                        {
                            t('startupoverlay.title',
                                { postProcess: 'resolveAppName' })
                        }
                    </h3>
                    <span className = 'inlay__text'>
                        {
                            translateToHTML(t,
                                `userMedia.${browser}GrantPermissions`)
                        }
                    </span>
                </div>
                <div className = 'policy overlay__policy'>
                    <p className = 'policy__text'>
                        { translateToHTML(t, 'startupoverlay.policyText') }
                    </p>
                    {
                        this._renderPolicyLogo()
                    }
                </div>
            </OverlayFrame>
        );
    }

    /**
     * Renders the policy logo.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderPolicyLogo() {
        const { policyLogoSrc } = this.state;

        if (policyLogoSrc) {
            return (
                <div className = 'policy__logo'>
                    <img src = { policyLogoSrc } />
                </div>
            );
        }

        return null;
    }
}

export default translate(
    connect(abstractMapStateToProps)(UserMediaPermissionsOverlay));
