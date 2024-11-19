import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate, translateToHTML } from '../../../base/i18n/functions';

import OverlayFrame from './OverlayFrame';

/**
 * The type of the React {@code Component} props of
 * {@link UserMediaPermissionsOverlay}.
 */
interface IProps extends WithTranslation {

    _premeetingBackground?: any;
}

/**
 * Implements a React Component for overlay with guidance how to proceed with
 * gUM prompt.
 */
class UserMediaPermissionsOverlay extends Component<IProps> {
    /**
     * Determines whether this overlay needs to be rendered (according to a
     * specific redux state). Called by {@link OverlayContainer}.
     *
     * @param {Object} state - The redux state.
     * @returns {boolean} - If this overlay needs to be rendered, {@code true};
     * {@code false}, otherwise.
     */
    static needsRender(state: IReduxState) {
        return state['features/overlay'].isMediaPermissionPromptVisible;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _premeetingBackground, t } = this.props;
        const style = _premeetingBackground ? {
            background: _premeetingBackground,
            backgroundPosition: 'center',
            backgroundSize: 'cover'
        } : {};

        return (
            <OverlayFrame style = { style }>
                <div className = 'inlay'>
                    <span className = 'inlay__icon icon-microphone' />
                    <span className = 'inlay__icon icon-camera' />
                    <h3
                        aria-label = { t('startupoverlay.genericTitle') }
                        className = 'inlay__title'
                        role = 'alert' >
                        {
                            t('startupoverlay.genericTitle')
                        }
                    </h3>
                    <span
                        className = 'inlay__text'
                        role = 'alert' >
                        {
                            t('userMedia.grantPermissions')
                        }
                    </span>
                </div>
                <div className = 'policy overlay__policy'>
                    <p
                        className = 'policy__text'
                        role = 'alert'>
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
        const policyLogoSrc = interfaceConfig.POLICY_LOGO;

        if (policyLogoSrc) {
            return (
                <div className = 'policy__logo'>
                    <img
                        alt = { this.props.t('welcomepage.logo.policyLogo') }
                        src = { policyLogoSrc } />
                </div>
            );
        }

        return null;
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The props passed to the component.
 * @returns {Object}
 */
function mapStateToProps(state: IReduxState) {
    const { premeetingBackground } = state['features/dynamic-branding'];

    return {
        _premeetingBackground: premeetingBackground
    };
}

export default translate(connect(mapStateToProps)(UserMediaPermissionsOverlay));
