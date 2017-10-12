/* global $, APP, AJS, interfaceConfig */
import { LANGUAGES } from '../../../../react/features/base/i18n';
import { openDeviceSelectionDialog }
    from '../../../../react/features/device-selection';

import UIUtil from '../../util/UIUtil';
import UIEvents from '../../../../service/UI/UIEvents';

const sidePanelsContainerId = 'sideToolbarContainer';
const deviceSelectionButtonClasses
    = 'button-control button-control_primary button-control_full-width';
const htmlStr = `
    <div id="settings_container" class="sideToolbarContainer__inner">
        <div class="title" data-i18n="settings.title"></div>
        <form class="aui">
            <div id="languagesSelectWrapper"
                class="sideToolbarBlock first hide">
                <select id="languagesSelect"></select>
            </div>
            <div id="deviceOptionsWrapper" class="hide">
                <div id="deviceOptionsTitle" class="subTitle hide"
                    data-i18n="settings.audioVideo"></div>
                <div class="sideToolbarBlock first">
                    <button
                        class="${deviceSelectionButtonClasses}"
                        data-i18n="deviceSelection.deviceSettings"
                        id="deviceSelection"
                        type="button"></button>
                </div>
            </div>
            <div id="moderatorOptionsWrapper" class="hide">
                <div id="moderatorOptionsTitle" class="subTitle hide"
                    data-i18n="settings.moderator"></div>
                <div id="startMutedOptions" class="hide">
                    <div class="sideToolbarBlock first">
                        <input type="checkbox" id="startAudioMuted">
                        <label class="startMutedLabel" for="startAudioMuted"
                            data-i18n="settings.startAudioMuted"></label>
                    </div>
                    <div class="sideToolbarBlock">
                        <input type="checkbox" id="startVideoMuted">
                        <label class="startMutedLabel" for="startVideoMuted"
                            data-i18n="settings.startVideoMuted"></label>
                    </div>
                </div>
                <div id="followMeOptions" class="hide">
                    <div class="sideToolbarBlock">
                        <input type="checkbox" id="followMeCheckBox">
                        <label class="followMeLabel" for="followMeCheckBox"
                            data-i18n="settings.followMe"></label>
                    </div>
                </div>
            </div>
        </form>
    </div>`;

/**
 *
 */
function initHTML() {
    $(`#${sidePanelsContainerId}`)
        .append(htmlStr);

    // make sure we translate the panel, as adding it can be after i18n
    // library had initialized and translated already present html
    APP.translation.translateElement($(`#${sidePanelsContainerId}`));
}

/**
 * Generate html select options for available languages.
 *
 * @param {string[]} items available languages
 * @param {string} [currentLang] current language
 * @returns {string}
 */
function generateLanguagesOptions(items, currentLang) {
    return items.map(lang => {
        const attrs = {
            value: lang,
            'data-i18n': `languages:${lang}`
        };

        if (lang === currentLang) {
            attrs.selected = 'selected';
        }

        const attrsStr = UIUtil.attrsToString(attrs);


        return `<option ${attrsStr}></option>`;
    }).join('');
}

/**
 * Replace html select element to select2 custom dropdown
 *
 * @param {jQueryElement} $el native select element
 * @param {function} onSelectedCb fired if item is selected
 */
function initSelect2($el, onSelectedCb) {
    $el.auiSelect2({
        minimumResultsForSearch: Infinity
    });
    if (typeof onSelectedCb === 'function') {
        $el.change(onSelectedCb);
    }
}

export default {
    init(emitter) {
        initHTML();

        // LANGUAGES BOX
        if (UIUtil.isSettingEnabled('language')) {
            const wrapperId = 'languagesSelectWrapper';
            const selectId = 'languagesSelect';
            const selectEl = AJS.$(`#${selectId}`);
            let selectInput; // eslint-disable-line prefer-const

            selectEl.html(generateLanguagesOptions(
                LANGUAGES,
                APP.translation.getCurrentLanguage()
            ));
            initSelect2(selectEl, () => {
                const val = selectEl.val();

                selectInput[0].dataset.i18n = `languages:${val}`;
                APP.translation.translateElement(selectInput);
                emitter.emit(UIEvents.LANG_CHANGED, val);
            });

            // find new selectInput element
            selectInput = $(`#s2id_${selectId} .select2-chosen`);

            // first select fix for languages options
            selectInput[0].dataset.i18n
                = `languages:${APP.translation.getCurrentLanguage()}`;

            // translate selectInput, which is the currently selected language
            // otherwise there will be no selected option
            APP.translation.translateElement(selectInput);
            APP.translation.translateElement(selectEl);

            APP.translation.addLanguageChangedListener(
                lng => {
                    selectInput[0].dataset.i18n = `languages:${lng}`;
                });

            UIUtil.setVisible(wrapperId, true);
        }

        // DEVICES LIST
        if (UIUtil.isSettingEnabled('devices')) {
            const wrapperId = 'deviceOptionsWrapper';

            $('#deviceSelection').on('click', () =>
                APP.store.dispatch(openDeviceSelectionDialog()));

            // Only show the subtitle if this isn't the only setting section.
            if (interfaceConfig.SETTINGS_SECTIONS.length > 1) {
                UIUtil.setVisible('deviceOptionsTitle', true);
            }

            UIUtil.setVisible(wrapperId, true);
        }

        // MODERATOR
        if (UIUtil.isSettingEnabled('moderator')) {
            const wrapperId = 'moderatorOptionsWrapper';

            // START MUTED
            $('#startMutedOptions').change(() => {
                const startAudioMuted = $('#startAudioMuted').is(':checked');
                const startVideoMuted = $('#startVideoMuted').is(':checked');

                emitter.emit(
                    UIEvents.START_MUTED_CHANGED,
                    startAudioMuted,
                    startVideoMuted
                );
            });

            // FOLLOW ME
            const followMeToggle = document.getElementById('followMeCheckBox');

            followMeToggle.addEventListener('change', () => {
                const isFollowMeEnabled = followMeToggle.checked;

                emitter.emit(UIEvents.FOLLOW_ME_ENABLED, isFollowMeEnabled);
            });

            UIUtil.setVisible(wrapperId, true);
        }
    },

    /**
     * If start audio muted/start video muted options should be visible or not.
     * @param {boolean} show
     */
    showStartMutedOptions(show) {
        if (show && UIUtil.isSettingEnabled('moderator')) {
            // Only show the subtitle if this isn't the only setting section.
            if (!$('#moderatorOptionsTitle').is(':visible')
                    && interfaceConfig.SETTINGS_SECTIONS.length > 1) {
                UIUtil.setVisible('moderatorOptionsTitle', true);
            }

            UIUtil.setVisible('startMutedOptions', true);
        } else {
            // Only show the subtitle if this isn't the only setting section.
            if ($('#moderatorOptionsTitle').is(':visible')) {
                UIUtil.setVisible('moderatorOptionsTitle', false);
            }

            UIUtil.setVisible('startMutedOptions', false);
        }
    },

    updateStartMutedBox(startAudioMuted, startVideoMuted) {
        $('#startAudioMuted').attr('checked', startAudioMuted);
        $('#startVideoMuted').attr('checked', startVideoMuted);
    },

    /**
     * Shows/hides the follow me options in the settings dialog.
     *
     * @param {boolean} show {true} to show those options, {false} to hide them
     */
    showFollowMeOptions(show) {
        UIUtil.setVisible(
            'followMeOptions',
            show && UIUtil.isSettingEnabled('moderator'));
    },

    /**
     * Check if settings menu is visible or not.
     * @returns {boolean}
     */
    isVisible() {
        return UIUtil.isVisible(document.getElementById('settings_container'));
    }
};
