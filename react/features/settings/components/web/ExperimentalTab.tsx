import { Theme } from '@mui/material';
import clsx from 'clsx';
import React from 'react';
import { WithTranslation } from 'react-i18next';
import { withStyles } from 'tss-react/mui';

import AbstractDialogTab, {
    IProps as AbstractDialogTabProps
} from '../../../base/dialog/components/web/AbstractDialogTab';
import { translate } from '../../../base/i18n/functions';
import Switch from '../../../base/ui/components/web/Switch';
import { ConfigOption, ConfigOptionValue, IConfigOptionValues } from '../../types';

/**
 * The type of the React {@code Component} props of {@link ExperimentalTab}.
 */
export interface IProps extends AbstractDialogTabProps, WithTranslation {

    /**
     * CSS classes object.
     */
    classes?: Partial<Record<keyof ReturnType<typeof styles>, string>>;

    /**
     * The config options to display.
     */
    options: ConfigOption[];

    /**
     * The current value of every displayed option, keyed by option id.
     */
    values: IConfigOptionValues;
}

const styles = (theme: Theme) => {
    return {
        container: {
            display: 'flex',
            flexDirection: 'column' as const,
            padding: '0 2px'
        },

        option: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: theme.spacing(3),
            padding: `${theme.spacing(3)} 0`,

            '&:not(:last-child)': {
                borderBottom: `1px solid ${theme.palette.settingsSectionBackground}`
            }
        },

        text: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: theme.spacing(1)
        },

        title: {
            ...theme.typography.bodyShortBold,
            color: theme.palette.settingsTabText
        },

        // Smaller than the title, so that the two read as a title and its explanation.
        description: {
            ...theme.typography.labelRegular,
            color: theme.palette.text02,
            fontSize: '0.6875rem',
            paddingTop: theme.spacing(1)
        },

        // Without it the switch, which has no content of its own, is squeezed by a long description.
        switch: {
            flexShrink: 0
        }
    };
};

/**
 * React {@code Component} for changing the experimental config options a user may decide for themselves.
 *
 * @augments Component
 */
class ExperimentalTab extends AbstractDialogTab<IProps, any> {
    /**
     * Initializes a new {@code ExperimentalTab} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onValueChange = this._onValueChange.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const { options, values } = this.props;
        const classes = withStyles.getClasses(this.props);

        return (
            <div
                className = { clsx('experimental-tab', classes.container) }
                key = 'experimental'>
                {options.map(option => this._renderOption(option, values[option.id]))}
            </div>
        );
    }

    /**
     * Records the new value of an option in the tab state; it is persisted when the dialog is submitted.
     *
     * @param {string} optionId - The id of the changed option.
     * @param {ConfigOptionValue} value - The new value of the option.
     * @returns {void}
     */
    _onValueChange(optionId: string, value: ConfigOptionValue) {
        super._onChange({
            values: {
                ...this.props.values,
                [optionId]: value
            }
        });
    }

    /**
     * Returns the React Element for a single config option: its title, description and control.
     *
     * @param {ConfigOption} option - The option to render.
     * @param {ConfigOptionValue} value - The current value of the option.
     * @returns {ReactElement}
     */
    _renderOption(option: ConfigOption, value: ConfigOptionValue) {
        const { descriptionKey, id, labelKey } = option;
        const { t } = this.props;
        const classes = withStyles.getClasses(this.props);
        const controlId = `config-option-${id}`;

        return (
            <div
                className = { classes.option }
                key = { id }>
                <div className = { classes.text }>
                    <label
                        className = { classes.title }
                        htmlFor = { controlId }>
                        {t(labelKey)}
                    </label>
                    <span className = { classes.description }>{t(descriptionKey)}</span>
                </div>
                {this._renderControl(option, value, controlId)}
            </div>
        );
    }

    /**
     * Returns the React Element that edits the value of a config option, which depends on the kind of value the
     * option holds.
     *
     * @param {ConfigOption} option - The option whose control to render.
     * @param {ConfigOptionValue} value - The current value of the option.
     * @param {string} controlId - The id of the control, which the option's title is the label of.
     * @returns {ReactElement}
     */
    _renderControl(option: ConfigOption, value: ConfigOptionValue, controlId: string) {
        const classes = withStyles.getClasses(this.props);

        // Only on/off options exist for now. The switch is deliberate: a new kind of value adds its own case here
        // with a control suited to it, e.g. a Select for a list of choices.
        switch (option.type) {
        case 'boolean':
            return (
                <Switch
                    checked = { Boolean(value) }
                    className = { classes.switch }
                    id = { controlId }
                    /* eslint-disable-next-line react/jsx-no-bind */
                    onChange = { on => this._onValueChange(option.id, Boolean(on)) } />
            );
        }
    }
}

export default withStyles(translate(ExperimentalTab), styles);
