// @flow

import { CheckboxGroup, CheckboxStateless } from '@atlaskit/checkbox';
import DropdownMenu, {
    DropdownItem,
    DropdownItemGroup
} from '@atlaskit/dropdown-menu';
import React from 'react';

import { AbstractDialogTab } from '../../../base/dialog';
import type { Props as AbstractDialogTabProps } from '../../../base/dialog';
import { translate } from '../../../base/i18n';

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
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { showModeratorSettings, showLanguageSettings } = this.props;
        const content = [];

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

        const languageItems = languages.map(language =>
            // eslint-disable-next-line react/jsx-wrap-multilines
            <DropdownItem
                key = { language }
                // eslint-disable-next-line react/jsx-no-bind
                onClick = {
                    () => super._onChange({ currentLanguage: language }) }>
                { t(`languages:${language}`) }
            </DropdownItem>
        );

        return (
            <div
                className = 'settings-sub-pane language-settings'
                key = 'language'>
                <div className = 'mock-atlaskit-label'>
                    { t('settings.language') }
                </div>
                <DropdownMenu
                    isOpen = { this.state.isLanguageSelectOpen }
                    onOpenChange = { this._onLanguageDropdownOpenChange }
                    shouldFitContainer = { true }
                    trigger = { currentLanguage
                        ? t(`languages:${currentLanguage}`)
                        : '' }
                    triggerButtonProps = {{
                        appearance: 'primary',
                        shouldFitContainer: true
                    }}
                    triggerType = 'button'>
                    <DropdownItemGroup>
                        { languageItems }
                    </DropdownItemGroup>
                </DropdownMenu>
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
            followMeEnabled,
            startAudioMuted,
            startVideoMuted,
            t
        } = this.props;

        return (
            <div
                className = 'settings-sub-pane'
                key = 'moderator'>
                <div className = 'mock-atlaskit-label'>
                    { t('settings.moderator') }
                </div>
                <CheckboxGroup>
                    <CheckboxStateless
                        isChecked = { startAudioMuted }
                        label = { t('settings.startAudioMuted') }
                        name = 'start-audio-muted'
                        // eslint-disable-next-line react/jsx-no-bind
                        onChange = {
                            ({ target: { checked } }) =>
                                super._onChange({ startAudioMuted: checked })
                        } />
                    <CheckboxStateless
                        isChecked = { startVideoMuted }
                        label = { t('settings.startVideoMuted') }
                        name = 'start-video-muted'
                        // eslint-disable-next-line react/jsx-no-bind
                        onChange = {
                            ({ target: { checked } }) =>
                                super._onChange({ startVideoMuted: checked })
                        } />
                    <CheckboxStateless
                        isChecked = { followMeEnabled }
                        label = { t('settings.followMe') }
                        name = 'follow-me'
                        // eslint-disable-next-line react/jsx-no-bind
                        onChange = {
                            ({ target: { checked } }) =>
                                super._onChange({ followMeEnabled: checked })
                        } />
                </CheckboxGroup>
            </div>
        );
    }
}

export default translate(MoreTab);
