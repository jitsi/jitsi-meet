// @flow
import { Checkbox } from '@atlaskit/checkbox';
import DropdownMenu, {
    DropdownItem,
    DropdownItemGroup
} from '@atlaskit/dropdown-menu';
import React from 'react';

import keyboardShortcut from '../../../../../modules/keyboardshortcut/keyboardshortcut';
import { AbstractDialogTab } from '../../../base/dialog';
import type { Props as AbstractDialogTabProps } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import TouchmoveHack from '../../../chat/components/web/TouchmoveHack';

/**
 * The type of the React {@code Component} props of {@link MoreTab}.
 */
export type Props = {
    ...$Exact<AbstractDialogTabProps>,

    /**
     * The currently selected language to display in the language select
     * dropdown.
     */
    currentLanguage: string,

    /**
     * Whether or not follow me is currently active (enabled by some other participant).
     */
    followMeActive: boolean,

    /**
     * Whether or not the user has selected the Follow Me feature to be enabled.
     */
    followMeEnabled: boolean,

    /**
     * All available languages to display in the language select dropdown.
     */
    languages: Array<string>,

    /**
     * Whether or not to display the language select dropdown.
     */
    showLanguageSettings: boolean,

    /**
     * Whether or not to display moderator-only settings.
     */
    showModeratorSettings: boolean,

    /**
     * Whether or not to display the prejoin settings section.
     */
    showPrejoinSettings: boolean,

    /**
     * Whether or not to show prejoin screen.
     */
    showPrejoinPage: boolean,


    /**
     * Whether or not the user has selected the Start Audio Muted feature to be
     * enabled.
     */
    startAudioMuted: boolean,

    /**
     * Whether or not the user has selected the Start Video Muted feature to be
     * enabled.
     */
    startVideoMuted: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link MoreTab}.
 */
type State = {

    /**
     * Whether or not the language select dropdown is open.
     */
    isLanguageSelectOpen: boolean
};

/**
 * React {@code Component} for modifying language and moderator settings.
 *
 * @extends Component
 */
class MoreTab extends AbstractDialogTab<Props, State> {
    /**
     * Initializes a new {@code MoreTab} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            isLanguageSelectOpen: false
        };

        // Bind event handler so it is only bound once for every instance.
        this._onLanguageDropdownOpenChange
            = this._onLanguageDropdownOpenChange.bind(this);
        this._onLanguageItemSelect = this._onLanguageItemSelect.bind(this);
        this._onStartAudioMutedChanged = this._onStartAudioMutedChanged.bind(this);
        this._onStartVideoMutedChanged = this._onStartVideoMutedChanged.bind(this);
        this._onFollowMeEnabledChanged = this._onFollowMeEnabledChanged.bind(this);
        this._onShowPrejoinPageChanged = this._onShowPrejoinPageChanged.bind(this);
        this._onKeyboardShortcutEnableChanged = this._onKeyboardShortcutEnableChanged.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { showModeratorSettings, showLanguageSettings, showPrejoinSettings } = this.props;
        const content = [];

        if (showPrejoinSettings) {
            content.push(this._renderPrejoinScreenSettings());
        }

        content.push(this._renderKeyboardShortcutCheckbox());


        if (showModeratorSettings) {
            content.push(this._renderModeratorSettings());
        }

        if (showLanguageSettings) {
            content.push(this._renderLangaugeSelect());
        }

        return <div className = 'more-tab'>{ content }</div>;
    }

    _onLanguageDropdownOpenChange: (Object) => void;

    /**
     * Callback invoked to toggle display of the language select dropdown.
     *
     * @param {Object} event - The event for opening or closing the dropdown.
     * @private
     * @returns {void}
     */
    _onLanguageDropdownOpenChange({ isOpen }) {
        this.setState({ isLanguageSelectOpen: isOpen });
    }

    _onLanguageItemSelect: (Object) => void;

    /**
     * Callback invoked to select a language from select dropdown.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onLanguageItemSelect(e) {
        const language = e.currentTarget.getAttribute('data-language');

        super._onChange({ currentLanguage: language });
    }

    _onStartAudioMutedChanged: (Object) => void;

    /**
     * Callback invoked to select if conferences should start
     * with audio muted.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onStartAudioMutedChanged({ target: { checked } }) {
        super._onChange({ startAudioMuted: checked });
    }

    _onStartVideoMutedChanged: (Object) => void;

    /**
     * Callback invoked to select if conferences should start
     * with video disabled.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onStartVideoMutedChanged({ target: { checked } }) {
        super._onChange({ startVideoMuted: checked });
    }

    _onFollowMeEnabledChanged: (Object) => void;

    /**
     * Callback invoked to select if follow-me mode
     * should be activated.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onFollowMeEnabledChanged({ target: { checked } }) {
        super._onChange({ followMeEnabled: checked });
    }

    _onShowPrejoinPageChanged: (Object) => void;

    /**
     * Callback invoked to select if the lobby
     * should be shown.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onShowPrejoinPageChanged({ target: { checked } }) {
        super._onChange({ showPrejoinPage: checked });
    }

    _onKeyboardShortcutEnableChanged: (Object) => void;

    /**
     * Callback invoked to select if global keyboard shortcuts
     * should be enabled.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onKeyboardShortcutEnableChanged({ target: { checked } }) {
        keyboardShortcut.enable(checked);
        super._onChange({ keyboardShortcutEnable: checked });
    }

    /**
     * Returns the menu item for changing displayed language.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderLangaugeSelect() {
        const {
            currentLanguage,
            languages,
            t
        } = this.props;

        const languageItems
            = languages.map(language => (
                <DropdownItem
                    data-language = { language }
                    key = { language }
                    onClick = { this._onLanguageItemSelect }>
                    { t(`languages:${language}`) }
                </DropdownItem>));

        return (
            <div
                className = 'settings-sub-pane language-settings'
                key = 'language'>
                <h2 className = 'mock-atlaskit-label'>
                    { t('settings.language') }
                </h2>
                <div className = 'dropdown-menu'>
                    <TouchmoveHack isModal = { true }>
                        <DropdownMenu
                            isOpen = { this.state.isLanguageSelectOpen }
                            onOpenChange = { this._onLanguageDropdownOpenChange }
                            shouldFitContainer = { true }
                            trigger = { currentLanguage
                                ? t(`languages:${currentLanguage}`)
                                : '' }
                            triggerButtonProps = {{
                                shouldFitContainer: true
                            }}
                            triggerType = 'button'>
                            <DropdownItemGroup>
                                { languageItems }
                            </DropdownItemGroup>
                        </DropdownMenu>
                    </TouchmoveHack>
                </div>
            </div>
        );
    }

    /**
     * Returns the React Element for modifying conference-wide settings.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderModeratorSettings() {
        const {
            followMeActive,
            followMeEnabled,
            startAudioMuted,
            startVideoMuted,
            t
        } = this.props;

        return (
            <div
                className = 'settings-sub-pane'
                key = 'moderator'>
                <h2 className = 'mock-atlaskit-label'>
                    { t('settings.moderator') }
                </h2>
                <Checkbox
                    isChecked = { startAudioMuted }
                    label = { t('settings.startAudioMuted') }
                    name = 'start-audio-muted'
                    onChange = { this._onStartAudioMutedChanged } />
                <Checkbox
                    isChecked = { startVideoMuted }
                    label = { t('settings.startVideoMuted') }
                    name = 'start-video-muted'
                    onChange = { this._onStartVideoMutedChanged } />
                <Checkbox
                    isChecked = { followMeEnabled && !followMeActive }
                    isDisabled = { followMeActive }
                    label = { t('settings.followMe') }
                    name = 'follow-me'
                    onChange = { this._onFollowMeEnabledChanged } />
            </div>
        );
    }

    /**
     * Returns the React Element for modifying prejoin screen settings.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderPrejoinScreenSettings() {
        const { t, showPrejoinPage } = this.props;

        return (
            <div
                className = 'settings-sub-pane'
                key = 'prejoin-screen'>
                <h2 className = 'mock-atlaskit-label'>
                    { t('prejoin.premeeting') }
                </h2>
                <Checkbox
                    isChecked = { showPrejoinPage }
                    label = { t('prejoin.showScreen') }
                    name = 'show-prejoin-page'
                    onChange = { this._onShowPrejoinPageChanged } />
            </div>
        );
    }

    /**
     * Returns the React Element for keyboardShortcut settings.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderKeyboardShortcutCheckbox() {
        const { t } = this.props;

        return (
            <div
                className = 'settings-sub-pane'
                key = 'keyboard-shortcut'>
                <h2 className = 'mock-atlaskit-label'>
                    { t('keyboardShortcuts.keyboardShortcuts') }
                </h2>
                <Checkbox
                    isChecked = { keyboardShortcut.getEnabled() }
                    label = { t('prejoin.keyboardShortcuts') }
                    name = 'enable-keyboard-shortcuts'
                    onChange = { this._onKeyboardShortcutEnableChanged } />
            </div>
        );
    }
}

export default translate(MoreTab);
