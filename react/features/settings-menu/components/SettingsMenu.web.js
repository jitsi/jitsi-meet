import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { getLocalParticipant, PARTICIPANT_ROLE } from '../../base/participants';

import DeviceSelectionButton from './DeviceSelectionButton';
import LanguageSelectDropdown from './LanguageSelectDropdown';
import ModeratorCheckboxes from './ModeratorCheckboxes';

/**
 * Implements a React {@link Component} which various ways to change application
 * settings.
 *
 * @extends Component
 */
class SettingsMenu extends Component {
    /**
     * {@code SettingsMenu} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Whether or not the local user is a moderator.
         */
        _isModerator: PropTypes.bool,

        /**
         * Whether or not the button to open device selection should display.
         */
        showDeviceSettings: PropTypes.bool,

        /**
         * Whether or not the dropdown to change the current translated language
         * should display.
         */
        showLanguageSettings: PropTypes.bool,

        /**
         * Whether or not moderator-only actions that affect the conference
         * should display.
         */
        showModeratorSettings: PropTypes.bool,

        /**
         * Whether or not menu section should have section titles displayed.
         */
        showTitles: PropTypes.bool,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _isModerator,
            showDeviceSettings,
            showLanguageSettings,
            showModeratorSettings,
            showTitles,
            t
        } = this.props;

        return (
            <div className = 'settings-menu'>
                <div className = 'title'>
                    { t('settings.title') }
                </div>
                { showLanguageSettings
                    ? <LanguageSelectDropdown />
                    : null }
                { showDeviceSettings
                    ? <DeviceSelectionButton showTitle = { showTitles } />
                    : null }
                { _isModerator && showModeratorSettings
                    ? <ModeratorCheckboxes showTitle = { showTitles } />
                    : null }
            </div>
        );
    }
}

/**
 * Maps parts of Redux store to component prop types.
 *
 * @param {Object} state - Snapshot of Redux store.
 * @returns {{
 *      _isModerator: boolean
 * }}
 */
function _mapStateToProps(state) {
    return {
        _isModerator:
            getLocalParticipant(state).role === PARTICIPANT_ROLE.MODERATOR
    };
}

export default translate(connect(_mapStateToProps)(SettingsMenu));
