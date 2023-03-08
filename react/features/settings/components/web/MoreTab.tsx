import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import clsx from 'clsx';
import React from 'react';
import { WithTranslation } from 'react-i18next';

import AbstractDialogTab, {
    IProps as AbstractDialogTabProps
} from '../../../base/dialog/components/web/AbstractDialogTab';
import { translate } from '../../../base/i18n/functions';
import Checkbox from '../../../base/ui/components/web/Checkbox';
import Select from '../../../base/ui/components/web/Select';
import { MAX_ACTIVE_PARTICIPANTS } from '../../../filmstrip/constants';

/**
 * The type of the React {@code Component} props of {@link MoreTab}.
 */
export interface IProps extends AbstractDialogTabProps, WithTranslation {

    /**
     * CSS classes object.
     */
    classes: any;

    /**
     * Whether or not follow me is currently active (enabled by some other participant).
     */
    followMeActive: boolean;

    /**
     * The number of max participants to display on stage.
     */
    maxStageParticipants: number;

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
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { showPrejoinSettings, classes } = this.props;

        return (
            <div
                className = { clsx('more-tab', classes.container) }
                key = 'more'>
                {showPrejoinSettings && <>
                    {this._renderPrejoinScreenSettings()}
                    <hr className = { classes.divider } />
                </>}
                {this._renderMaxStageParticipantsSelect()}
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
}

export default withStyles(styles)(translate(MoreTab));
