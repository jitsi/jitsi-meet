/* global $, APP, interfaceConfig */

/* eslint-disable no-unused-vars */

import React from 'react';
import ReactDOM from 'react-dom';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';

import { i18next } from '../../../../react/features/base/i18n';
import { SettingsMenu } from '../../../../react/features/settings';
import UIUtil from '../../util/UIUtil';

/* eslint-enable no-unused-vars */

export default {
    init() {
        const settingsMenuContainer = document.createElement('div');

        settingsMenuContainer.id = 'settings_container';
        settingsMenuContainer.className = 'sideToolbarContainer__inner';

        $('#sideToolbarContainer').append(settingsMenuContainer);

        const props = {
            showDeviceSettings: UIUtil.isSettingEnabled('devices'),
            showLanguageSettings: UIUtil.isSettingEnabled('language'),
            showModeratorSettings: UIUtil.isSettingEnabled('moderator'),
            showTitles: interfaceConfig.SETTINGS_SECTIONS.length > 1
        };

        ReactDOM.render(
            <Provider store = { APP.store }>
                <I18nextProvider i18n = { i18next }>
                    <SettingsMenu { ...props } />
                </I18nextProvider>
            </Provider>,
            settingsMenuContainer
        );
    },

    /**
     * Check if settings menu is visible or not.
     * @returns {boolean}
     */
    isVisible() {
        return UIUtil.isVisible(document.getElementById('settings_container'));
    }
};
