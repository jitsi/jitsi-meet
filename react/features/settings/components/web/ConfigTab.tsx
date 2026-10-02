import { Theme } from '@mui/material';
import clsx from 'clsx';
import React from 'react';
import { WithTranslation } from 'react-i18next';
import { withStyles } from 'tss-react/mui';

import AbstractDialogTab, {
    IProps as AbstractDialogTabProps
} from '../../../base/dialog/components/web/AbstractDialogTab';
import { translate } from '../../../base/i18n/functions';
import Label from '../../../base/label/components/web/Label';
import Switch from '../../../base/ui/components/web/Switch';
import { IConfigToggle } from '../../types';

/**
 * The type of the React {@code Component} props of {@link ConfigTab}.
 */
export interface IProps extends AbstractDialogTabProps, WithTranslation {

    /**
     * CSS classes object.
     */
    classes?: Partial<Record<keyof ReturnType<typeof styles>, string>>;

    /**
     * The config toggles to display.
     */
    toggles: IConfigToggle[];

    /**
     * The current value of every displayed toggle, keyed by its config path.
     */
    values: { [configPath: string]: boolean; };
}

const styles = (theme: Theme) => {
    return {
        container: {
            display: 'flex',
            flexDirection: 'column' as const,
            padding: '0 2px'
        },

        toggle: {
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
            color: theme.palette.settingsTabText,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing(2)
        },

        description: {
            ...theme.typography.bodyShortRegular,
            color: theme.palette.text02
        }
    };
};

/**
 * React {@code Component} for switching user-configurable config options on and off.
 *
 * @augments Component
 */
class ConfigTab extends AbstractDialogTab<IProps, any> {
    /**
     * Initializes a new {@code ConfigTab} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onToggleChange = this._onToggleChange.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const { toggles, values } = this.props;
        const classes = withStyles.getClasses(this.props);

        return (
            <div
                className = { clsx('config-tab', classes.container) }
                key = 'config'>
                {toggles.map(toggle => this._renderToggle(toggle, values[toggle.configPath]))}
            </div>
        );
    }

    /**
     * Records the new value of a toggle in the tab state; it is persisted when the dialog is submitted.
     *
     * @param {string} configPath - The config path of the changed toggle.
     * @param {boolean} on - Whether the toggle was switched on.
     * @returns {void}
     */
    _onToggleChange(configPath: string, on?: boolean) {
        super._onChange({
            values: {
                ...this.props.values,
                [configPath]: Boolean(on)
            }
        });
    }

    /**
     * Returns the React Element for a single config toggle.
     *
     * @param {IConfigToggle} toggle - The toggle to render.
     * @param {boolean} checked - Whether the toggle is currently on.
     * @returns {ReactElement}
     */
    _renderToggle({ configPath, descriptionKey, experimental, labelKey }: IConfigToggle, checked: boolean) {
        const { t } = this.props;
        const classes = withStyles.getClasses(this.props);
        const id = `config-toggle-${configPath}`;

        return (
            <div
                className = { classes.toggle }
                key = { configPath }>
                <div className = { classes.text }>
                    <div className = { classes.title }>
                        <label htmlFor = { id }>{t(labelKey)}</label>
                        {experimental && <Label text = { t('settings.experimental') } />}
                    </div>
                    <span className = { classes.description }>{t(descriptionKey)}</span>
                </div>
                <Switch
                    checked = { checked }
                    id = { id }
                    /* eslint-disable-next-line react/jsx-no-bind */
                    onChange = { on => this._onToggleChange(configPath, on) } />
            </div>
        );
    }
}

export default withStyles(translate(ConfigTab), styles);
