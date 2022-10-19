import React from 'react';
import { WithTranslation } from 'react-i18next';

// @ts-expect-error
import keyboardShortcut from '../../../../../modules/keyboardshortcut/keyboardshortcut';
import AbstractDialogTab, {
    Props as AbstractDialogTabProps
} from '../../../base/dialog/components/web/AbstractDialogTab';
import { translate } from '../../../base/i18n/functions';
import Checkbox from '../../../base/ui/components/web/Checkbox';
import Select from '../../../base/ui/components/web/Select';
import { MAX_ACTIVE_PARTICIPANTS } from '../../../filmstrip/constants';
import { SS_DEFAULT_FRAME_RATE } from '../../constants';

/**
 * The type of the React {@code Component} props of {@link MoreTab}.
 */
export type Props = AbstractDialogTabProps & WithTranslation & {

    /**
     * The currently selected desktop share frame rate in the frame rate select dropdown.
     */
    currentFramerate: string;

    /**
     * The currently selected language to display in the language select
     * dropdown.
     */
    currentLanguage: string;

    /**
     * All available desktop capture frame rates.
     */
    desktopShareFramerates: Array<number>;

    /**
     * Whether to show hide self view setting.
     */
    disableHideSelfView: boolean;

    /**
     * The types of enabled notifications that can be configured and their specific visibility.
     */
    enabledNotifications: Object;

    /**
     * Whether or not follow me is currently active (enabled by some other participant).
     */
    followMeActive: boolean;

    /**
     * Whether or not to hide self-view screen.
     */
    hideSelfView: boolean;

    /**
     * All available languages to display in the language select dropdown.
     */
    languages: Array<string>;

    /**
     * The number of max participants to display on stage.
     */
    maxStageParticipants: number;

    /**
     * Whether or not to display the language select dropdown.
     */
    showLanguageSettings: boolean;

    /**
     * Whether or not to display moderator-only settings.
     */
    showModeratorSettings: boolean;

    /**
     * Whether or not to display notifications settings.
     */
    showNotificationsSettings: boolean;

    /**
     * Whether or not to show prejoin screen.
     */
    showPrejoinPage: boolean;

    /**
     * Whether or not to display the prejoin settings section.
     */
    showPrejoinSettings: boolean;

    /**
     * Wether or not the stage filmstrip is enabled.
     */
    stageFilmstripEnabled: boolean;

    /**
     * Invoked to obtain translated strings.
     */
    t: Function;
};

/**
 * React {@code Component} for modifying language and moderator settings.
 *
 * @augments Component
 */
class MoreTab extends AbstractDialogTab<Props, {}> {
    /**
     * Initializes a new {@code MoreTab} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onFramerateItemSelect = this._onFramerateItemSelect.bind(this);
        this._onLanguageItemSelect = this._onLanguageItemSelect.bind(this);
        this._onEnabledNotificationsChanged = this._onEnabledNotificationsChanged.bind(this);
        this._onShowPrejoinPageChanged = this._onShowPrejoinPageChanged.bind(this);
        this._onKeyboardShortcutEnableChanged = this._onKeyboardShortcutEnableChanged.bind(this);
        this._onHideSelfViewChanged = this._onHideSelfViewChanged.bind(this);
        this._renderMaxStageParticipantsSelect = this._renderMaxStageParticipantsSelect.bind(this);
        this._onMaxStageParticipantsSelect = this._onMaxStageParticipantsSelect.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const content = [];

        content.push(this._renderSettingsLeft());
        content.push(this._renderSettingsRight());

        return (
            <div
                className = 'more-tab box'
                key = 'more'>
                { content }
            </div>
        );
    }

    /**
     * Callback invoked to select a frame rate from the select dropdown.
     *
     * @param {Object} e - The key event to handle.
     * @private
     * @returns {void}
     */
    _onFramerateItemSelect(e: React.ChangeEvent<HTMLSelectElement>) {
        const frameRate = e.target.value;

        super._onChange({ currentFramerate: frameRate });
    }

    /**
     * Callback invoked to select a language from select dropdown.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onLanguageItemSelect(e: React.ChangeEvent<HTMLSelectElement>) {
        const language = e.target.value;

        super._onChange({ currentLanguage: language });
    }

    /**
     * Callback invoked to select if the lobby
     * should be shown.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onShowPrejoinPageChanged({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) {
        super._onChange({ showPrejoinPage: checked });
    }

    /**
     * Callback invoked to select if the given type of
     * notifications should be shown.
     *
     * @param {Object} e - The key event to handle.
     * @param {string} type - The type of the notification.
     *
     * @returns {void}
     */
    _onEnabledNotificationsChanged({ target: { checked } }: React.ChangeEvent<HTMLInputElement>, type: any) {
        super._onChange({
            enabledNotifications: {
                ...this.props.enabledNotifications,
                [type]: checked
            }
        });
    }

    /**
     * Callback invoked to select if global keyboard shortcuts
     * should be enabled.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onKeyboardShortcutEnableChanged({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) {
        keyboardShortcut.enable(checked);
        super._onChange({ keyboardShortcutEnable: checked });
    }

    /**
     * Callback invoked to select if hide self view should be enabled.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onHideSelfViewChanged({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) {
        super._onChange({ hideSelfView: checked });
    }

    /**
     * Callback invoked to select a max number of stage participants from the select dropdown.
     *
     * @param {Object} e - The key event to handle.
     * @private
     * @returns {void}
     */
    _onMaxStageParticipantsSelect(e: React.ChangeEvent<HTMLSelectElement>) {
        const maxParticipants = Number(e.target.value);

        super._onChange({ maxStageParticipants: maxParticipants });
    }

    /**
     * Returns the React Element for the desktop share frame rate dropdown.
     *
     * @returns {ReactElement}
     */
    _renderFramerateSelect() {
        const { currentFramerate, desktopShareFramerates, t } = this.props;
        const frameRateItems = desktopShareFramerates.map((frameRate: number) => {
            return {
                value: frameRate,
                label: `${frameRate} ${t('settings.framesPerSecond')}`
            };
        });

        return (
            <div
                className = 'settings-sub-pane-element'
                key = 'frameRate'>
                <div className = 'dropdown-menu'>
                    <Select
                        bottomLabel = { parseInt(currentFramerate, 10) > SS_DEFAULT_FRAME_RATE
                            ? t('settings.desktopShareHighFpsWarning')
                            : t('settings.desktopShareWarning') }
                        label = { t('settings.desktopShareFramerate') }
                        onChange = { this._onFramerateItemSelect }
                        options = { frameRateItems }
                        value = { currentFramerate } />
                </div>
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
                className = 'settings-sub-pane-element'
                key = 'keyboard-shortcut'>
                <span className = 'checkbox-label'>
                    { t('keyboardShortcuts.keyboardShortcuts') }
                </span>
                <Checkbox
                    checked = { keyboardShortcut.getEnabled() }
                    label = { t('prejoin.keyboardShortcuts') }
                    name = 'enable-keyboard-shortcuts'
                    onChange = { this._onKeyboardShortcutEnableChanged } />
            </div>
        );
    }

    /**
     * Returns the React Element for self view setting.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderSelfViewCheckbox() {
        const { hideSelfView, t } = this.props;

        return (
            <div
                className = 'settings-sub-pane-element'
                key = 'selfview'>
                <span className = 'checkbox-label'>
                    { t('settings.selfView') }
                </span>
                <Checkbox
                    checked = { hideSelfView }
                    label = { t('videothumbnail.hideSelfView') }
                    name = 'hide-self-view'
                    onChange = { this._onHideSelfViewChanged } />
            </div>
        );
    }

    /**
     * Returns the menu item for changing displayed language.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderLanguageSelect() {
        const {
            currentLanguage,
            languages,
            t
        } = this.props;

        const languageItems
            = languages.map((language: string) => {
                return {
                    value: language,
                    label: t(`languages:${language}`)
                };
            });

        return (
            <div
                className = 'settings-sub-pane-element'
                key = 'language'>
                <div className = 'dropdown-menu'>
                    <Select
                        label = { t('settings.language') }
                        onChange = { this._onLanguageItemSelect }
                        options = { languageItems }
                        value = { currentLanguage } />
                </div>
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
                className = 'settings-sub-pane-element'
                key = 'prejoin-screen'>
                <span className = 'checkbox-label'>
                    { t('prejoin.premeeting') }
                </span>
                <Checkbox
                    checked = { showPrejoinPage }
                    label = { t('prejoin.showScreen') }
                    name = 'show-prejoin-page'
                    onChange = { this._onShowPrejoinPageChanged } />
            </div>
        );
    }

    /**
     * Returns the React Element for modifying the enabled notifications settings.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderNotificationsSettings() {
        const { t, enabledNotifications } = this.props;

        return (
            <div
                className = 'settings-sub-pane-element'
                key = 'notifications'>
                <span className = 'checkbox-label'>
                    { t('notify.displayNotifications') }
                </span>
                {
                    Object.keys(enabledNotifications).map(key => (
                        <Checkbox
                            checked = { Boolean(enabledNotifications[key as keyof typeof enabledNotifications]) }
                            key = { key }
                            label = { t(key) }
                            name = { `show-${key}` }
                            /* eslint-disable-next-line react/jsx-no-bind */
                            onChange = { e => this._onEnabledNotificationsChanged(e, key) } />
                    ))
                }
            </div>
        );
    }

    /**
     * Returns the React Element for the max stage participants dropdown.
     *
     * @returns {ReactElement}
     */
    _renderMaxStageParticipantsSelect() {
        const { maxStageParticipants, t, stageFilmstripEnabled } = this.props;

        if (!stageFilmstripEnabled) {
            return null;
        }
        const maxParticipantsItems = Array(MAX_ACTIVE_PARTICIPANTS).fill(0)
            .map((no, index) => {
                return {
                    value: index + 1,
                    label: `${index + 1}`
                };
            });

        return (
            <div
                className = 'settings-sub-pane-element'
                key = 'maxStageParticipants'>
                <div className = 'dropdown-menu'>
                    <Select
                        label = { t('settings.maxStageParticipants') }
                        onChange = { this._onMaxStageParticipantsSelect }
                        options = { maxParticipantsItems }
                        value = { maxStageParticipants } />
                </div>
            </div>
        );
    }

    /**
     * Returns the React element that needs to be displayed on the right half of the more tabs.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderSettingsRight() {
        const { showLanguageSettings } = this.props;

        return (
            <div
                className = 'settings-sub-pane right'
                key = 'settings-sub-pane-right'>
                { showLanguageSettings && this._renderLanguageSelect() }
                { this._renderFramerateSelect() }
                { this._renderMaxStageParticipantsSelect() }
            </div>
        );
    }

    /**
     * Returns the React element that needs to be displayed on the left half of the more tabs.
     *
     * @returns {ReactElement}
     */
    _renderSettingsLeft() {
        const { disableHideSelfView, showNotificationsSettings, showPrejoinSettings } = this.props;

        return (
            <div
                className = 'settings-sub-pane left'
                key = 'settings-sub-pane-left'>
                { showPrejoinSettings && this._renderPrejoinScreenSettings() }
                { showNotificationsSettings && this._renderNotificationsSettings() }
                { this._renderKeyboardShortcutCheckbox() }
                { !disableHideSelfView && this._renderSelfViewCheckbox() }
            </div>
        );
    }
}

export default translate(MoreTab);
