import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { setFollowMe, setStartMutedPolicy } from '../../../base/conference';
import { translate } from '../../../base/i18n';

/**
 * Implements a React {@link Component} which displays checkboxes for enabling
 * and disabling moderator-only conference features.
 *
 * @extends Component
 */
class ModeratorCheckboxes extends Component {
    /**
     * {@code ModeratorCheckboxes} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Whether or not the Follow Me feature is currently enabled.
         */
        _followMeEnabled: PropTypes.bool,

        /**
         * Whether or not new members will join the conference as audio muted.
         */
        _startAudioMutedPolicy: PropTypes.bool,

        /**
         * Whether or note new member will join the conference as video muted.
         */
        _startVideoMutedPolicy: PropTypes.bool,

        /**
         * Invoked to enable and disable moderator-only conference features.
         */
        dispatch: PropTypes.func,

        /**
         * Whether or not the title should be displayed.
         */
        showTitle: PropTypes.bool,

        /**
         * Invokted to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * Initializes a new {@code ModeratorCheckboxes} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onSetFollowMeSetting
            = this._onSetFollowMeSetting.bind(this);
        this._onSetStartAudioMutedPolicy
            = this._onSetStartAudioMutedPolicy.bind(this);
        this._onSetStartVideoMutedPolicy
            = this._onSetStartVideoMutedPolicy.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _followMeEnabled,
            _startAudioMutedPolicy,
            _startVideoMutedPolicy,
            showTitle,
            t
        } = this.props;

        return (
            <div>
                { showTitle
                    ? <div className = 'subTitle'>
                        { t('settings.moderator') }
                    </div>
                    : null }
                <div className = 'moderator-option'>
                    <input
                        checked = { _startAudioMutedPolicy }
                        className = 'moderator-checkbox'
                        id = 'startAudioMuted'
                        onChange = { this._onSetStartAudioMutedPolicy }
                        type = 'checkbox' />
                    <label
                        className = 'moderator-checkbox-label'
                        htmlFor = 'startAudioMuted'>
                        { t('settings.startAudioMuted') }
                    </label>
                </div>
                <div className = 'moderator-option'>
                    <input
                        checked = { _startVideoMutedPolicy }
                        className = 'moderator-checkbox'
                        id = 'startVideoMuted'
                        onChange = { this._onSetStartVideoMutedPolicy }
                        type = 'checkbox' />
                    <label
                        className = 'moderator-checkbox-label'
                        htmlFor = 'startVideoMuted'>
                        { t('settings.startVideoMuted') }
                    </label>
                </div>
                <div className = 'moderator-option'>
                    <input
                        checked = { _followMeEnabled }
                        className = 'moderator-checkbox'
                        id = 'followMeCheckBox'
                        onChange = { this._onSetFollowMeSetting }
                        type = 'checkbox' />
                    <label
                        className = 'moderator-checkbox-label'
                        htmlFor = 'followMeCheckBox'>
                        { t('settings.followMe') }
                    </label>
                </div>
            </div>
        );
    }

    /**
     * Toggles the Follow Me feature.
     *
     * @param {Object} event - The dom event returned from changes the checkbox.
     * @private
     * @returns {void}
     */
    _onSetFollowMeSetting(event) {
        this.props.dispatch(setFollowMe(event.target.checked));
    }

    /**
     * Toggles whether or not new members should join the conference as audio
     * muted.
     *
     * @param {Object} event - The dom event returned from changes the checkbox.
     * @private
     * @returns {void}
     */
    _onSetStartAudioMutedPolicy(event) {
        this.props.dispatch(setStartMutedPolicy(
            event.target.checked, this.props._startVideoMutedPolicy));
    }

    /**
     * Toggles whether or not new members should join the conference as video
     * muted.
     *
     * @param {Object} event - The dom event returned from changes the checkbox.
     * @private
     * @returns {void}
     */
    _onSetStartVideoMutedPolicy(event) {
        this.props.dispatch(setStartMutedPolicy(
            this.props._startAudioMutedPolicy, event.target.checked));
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code ModeratorCheckboxes} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _followMeEnabled: boolean,
 *     _startAudioMutedPolicy: boolean,
 *     _startVideoMutedPolicy: boolean
 * }}
 */
function _mapStateToProps(state) {
    const {
        followMeEnabled,
        startAudioMutedPolicy,
        startVideoMutedPolicy
    } = state['features/base/conference'];

    return {
        _followMeEnabled: Boolean(followMeEnabled),
        _startAudioMutedPolicy: Boolean(startAudioMutedPolicy),
        _startVideoMutedPolicy: Boolean(startVideoMutedPolicy)
    };
}

export default translate(connect(_mapStateToProps)(ModeratorCheckboxes));
