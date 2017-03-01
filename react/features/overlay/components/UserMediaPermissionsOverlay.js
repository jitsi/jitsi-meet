/* global interfaceConfig */

import React from 'react';

import { translate, translateToHTML } from '../../base/i18n';

import AbstractOverlay from './AbstractOverlay';

/**
 * Implements a React Component for overlay with guidance how to proceed with
 * gUM prompt.
 */
class UserMediaPermissionsOverlay extends AbstractOverlay {
    /**
     * UserMediaPermissionsOverlay component's property types.
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
        browser: React.PropTypes.string
    }

    /**
     * Initializes a new SuspendedOverlay instance.
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
     * Constructs overlay body with the message with guidance how to proceed
     * with gUM prompt.
     *
     * @returns {ReactElement|null}
     * @override
     * @protected
     */
    _renderOverlayContent() {
        const { browser, t } = this.props;

        return (
            <div>
                <div className = 'inlay'>
                    <span className = 'inlay__icon icon-microphone' />
                    <span className = 'inlay__icon icon-camera' />
                    <h3 className = 'inlay__title'>
                        {
                            t(
                                'startupoverlay.title',
                                { postProcess: 'resolveAppName' })
                        }
                    </h3>
                    <span className = 'inlay__text'>
                        {
                            translateToHTML(
                                t,
                                `userMedia.${browser}GrantPermissions`)
                        }
                    </span>
                </div>
                <div className = 'policy overlay__policy'>
                    <p className = 'policy__text'>
                        { t('startupoverlay.policyText') }
                    </p>
                    {
                        this._renderPolicyLogo()
                    }
                </div>
            </div>
        );
    }

    /**
     * Renders the policy logo.
     *
     * @returns {ReactElement|null}
     * @private
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

export default translate(UserMediaPermissionsOverlay);
