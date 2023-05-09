import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import clsx from 'clsx';
import React, { KeyboardEvent } from 'react';
import { WithTranslation } from 'react-i18next';

import AbstractDialogTab, {
    IProps as AbstractDialogTabProps
} from '../../../base/dialog/components/web/AbstractDialogTab';
import { translate } from '../../../base/i18n/functions';
import { IconInfoCircle } from '../../../base/icons/svg';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Checkbox from '../../../base/ui/components/web/Checkbox';
import Input from '../../../base/ui/components/web/Input';
import Select from '../../../base/ui/components/web/Select';
import { MAX_ACTIVE_PARTICIPANTS } from '../../../filmstrip/constants';

/**
 * The type of the React {@code Component} props of {@link MoreTab}.
 */
export interface IProps extends AbstractDialogTabProps, WithTranslation {

    /**
     * The assumed bandwidth bps value.
     */
    assumedBandwidthBps?: number | string;

    /**
     * CSS classes object.
     */
    classes: any;

    /**
     * The currently selected language to display in the language select
     * dropdown.
     */
    currentLanguage: string;

    /**
     * Whether to show hide self view setting.
     */
    disableHideSelfView: boolean;

    /**
     * Whether or not follow me is currently active (enabled by some other participant).
     */
    followMeActive: boolean;

    /**
     * Whether or not to hide self-view screen.
     */
    hideSelfView: boolean;

    /**
     * Whether we are in visitors mode.
     */
    iAmVisitor: boolean;

    /**
     * All available languages to display in the language select dropdown.
     */
    languages: Array<string>;

    /**
     * The number of max participants to display on stage.
     */
    maxStageParticipants: number;

    /**
     * Whether or not to display the bandwidth settings section.
     */
    showBandwidthSettings: boolean;

    /**
     * Whether or not to display the language select dropdown.
     */
    showLanguageSettings: boolean;

    /**
     * Whether or not to display moderator-only settings.
     */
    showModeratorSettings: boolean;

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
}

const styles = (theme: Theme) => {
    return {
        container: {
            display: 'flex',
            flexDirection: 'column' as const
        },

        divider: {
            margin: `${theme.spacing(4)} 0`,
            width: '100%',
            height: '1px',
            border: 0,
            backgroundColor: theme.palette.ui03
        },

        info: {
            background: theme.palette.ui01,
            ...withPixelLineHeight(theme.typography.labelRegular),
            color: theme.palette.text02
        },

        possibleValues: {
            listStyle: 'none',
            margin: 0,
            paddingLeft: theme.spacing(4)
        }
    };
};

/**
 * React {@code Component} for modifying language and moderator settings.
 *
 * @augments Component
 */
class MoreTab extends AbstractDialogTab<IProps, any> {
    /**
     * Initializes a new {@code MoreTab} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onShowPrejoinPageChanged = this._onShowPrejoinPageChanged.bind(this);
        this._renderMaxStageParticipantsSelect = this._renderMaxStageParticipantsSelect.bind(this);
        this._onMaxStageParticipantsSelect = this._onMaxStageParticipantsSelect.bind(this);
        this._onHideSelfViewChanged = this._onHideSelfViewChanged.bind(this);
        this._onLanguageItemSelect = this._onLanguageItemSelect.bind(this);
        this._onAssumedBandwidthBpsChange = this._onAssumedBandwidthBpsChange.bind(this);
        this._onAssumedBandwidthBpsKeyPress = this._onAssumedBandwidthBpsKeyPress.bind(this);
        this._toggleInfoPanel = this._toggleInfoPanel.bind(this);

        this.state = {
            showAssumedBandwidthInfo: false
        };
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            classes,
            disableHideSelfView,
            iAmVisitor,
            hideSelfView,
            showBandwidthSettings,
            showLanguageSettings,
            showPrejoinSettings,
            t
        } = this.props;

        return (
            <div
                className = { clsx('more-tab', classes.container) }
                key = 'more'>
                {showPrejoinSettings && <>
                    {this._renderPrejoinScreenSettings()}
                    <hr className = { classes.divider } />
                </>}
                {this._renderMaxStageParticipantsSelect()}
                {showBandwidthSettings && <>
                    <hr className = { classes.divider } />
                    {this._renderBandwidthSettings()}
                </>}
                {!disableHideSelfView && !iAmVisitor && <>
                    <hr className = { classes.divider } />
                    <Checkbox
                        checked = { hideSelfView }
                        label = { t('videothumbnail.hideSelfView') }
                        name = 'hide-self-view'
                        onChange = { this._onHideSelfViewChanged } />
                </>}
                {showLanguageSettings && <>
                    <hr className = { classes.divider } />
                    {this._renderLanguageSelect()}
                </>}
            </div>
        );
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
     * Changes the assumed bandwidth bps.
     *
     * @param {string} value - The key event to handle.
     *
     * @returns {void}
     */
    _onAssumedBandwidthBpsChange(value: string) {
        super._onChange({ assumedBandwidthBps: value });
    }

    /**
     * Validates the assumed bandwidth bps.
     *
     * @param {KeyboardEvent<any>} e - The key event to handle.
     *
     * @returns {void}
     */
    _onAssumedBandwidthBpsKeyPress(e: KeyboardEvent<any>) {
        const isValid = (e.charCode !== 8 && e.charCode === 0) || (e.charCode >= 48 && e.charCode <= 57);

        if (!isValid) {
            e.preventDefault();
        }
    }

    /**
     * Callback invoked to hide or show the possible values
     * of the assumed bandwidth setting.
     *
     * @returns {void}
     */
    _toggleInfoPanel() {
        this.setState({
            showAssumedBandwidthInfo: !this.state.showAssumedBandwidthInfo
        });
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
            <Checkbox
                checked = { showPrejoinPage }
                label = { t('prejoin.showScreen') }
                name = 'show-prejoin-page'
                onChange = { this._onShowPrejoinPageChanged } />
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
            <Select
                label = { t('settings.maxStageParticipants') }
                onChange = { this._onMaxStageParticipantsSelect }
                options = { maxParticipantsItems }
                value = { maxStageParticipants } />
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
            classes,
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
            <Select
                className = { classes.bottomMargin }
                label = { t('settings.language') }
                onChange = { this._onLanguageItemSelect }
                options = { languageItems }
                value = { currentLanguage } />
        );
    }

    /**
     * Returns the React Element for the assumed bandwidth bps.
     *
     * @returns {ReactElement}
     */
    _renderBandwidthSettings() {
        const { assumedBandwidthBps = '', classes, t } = this.props;

        return (
            <>
                <Input
                    bottomLabel = { t('settings.assumedBandwidthBpsWarning') }
                    icon = { IconInfoCircle }
                    iconClick = { this._toggleInfoPanel }
                    id = 'setAssumedBandwidthBps'
                    label = { t('profile.setAssumedBandwidthBps') }
                    min = { 0 }
                    name = 'assumedBandwidthBps'
                    onChange = { this._onAssumedBandwidthBpsChange }
                    onKeyPress = { this._onAssumedBandwidthBpsKeyPress }
                    placeholder = { t('settings.assumedBandwidthBps') }
                    type = 'number'
                    value = { assumedBandwidthBps } />
                {this.state.showAssumedBandwidthInfo && (
                    <div className = { classes.info }>
                        <span>{t('settings.possibleValues')}:</span>
                        <ul className = { classes.possibleValues }>
                            <li><b>{t('settings.leaveEmpty')}</b> {t('settings.leaveEmptyEffect')}</li>
                            <li><b>0</b> {t('settings.zeroEffect')}</li>
                            <li><b>{t('settings.customValue')}</b> {t('settings.customValueEffect')}</li>
                        </ul>
                    </div>
                )}
            </>
        );
    }
}

export default withStyles(styles)(translate(MoreTab));
