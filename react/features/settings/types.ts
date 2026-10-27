import { IReduxState } from '../app/types';

/**
 * The properties shared by every config option the user can choose a value for, whatever the kind of value it holds.
 *
 * @template T - The type of the option's value.
 */
interface IConfigOptionBase<T> {

    /**
     * The translation key of the text explaining what the option does.
     */
    descriptionKey: string;

    /**
     * Returns the effective value of the option: the value the config sets when there is one, else the user's choice,
     * else the option's default. The feature owning the option provides it, since it decides how its config and the
     * user's choice combine.
     */
    getValue: (state: IReduxState) => T;

    /**
     * The key under which the user's choice is persisted. It is deliberately not the path of the config option, so
     * that a rename of the config option does not lose the choices users have already made.
     */
    id: string;

    /**
     * Returns whether the user may decide the option here: the feature applies to the current environment, e.g. the
     * browser supports it, and no config source has set the option's value. A value set by config.js, URL parameters
     * or the iframe API is the deployment's or the embedder's decision and is final, so the option is not displayed.
     */
    isAvailable: (state: IReduxState) => boolean;

    /**
     * The translation key of the option's title.
     */
    labelKey: string;
}

/**
 * A config option that is either on or off, displayed as a switch.
 */
export interface IBooleanConfigOption extends IConfigOptionBase<boolean> {

    /**
     * The kind of value the option holds.
     */
    type: 'boolean';
}

/**
 * Any config option the user can choose a value for. To support a new kind of value, add its interface to this
 * union, widen {@code userSelectedConfig} in the settings reducer and the check in {@code getUserSelectedConfigValue},
 * and add a case rendering its control to {@code ExperimentalTab}.
 */
export type ConfigOption = IBooleanConfigOption;

/**
 * Any value a config option can hold.
 */
export type ConfigOptionValue = ReturnType<ConfigOption['getValue']>;

/**
 * The values of config options, keyed by option id.
 */
export interface IConfigOptionValues {
    [optionId: string]: ConfigOptionValue;
}

/**
 * The state of the Experimental tab of the settings dialog: the values the user has set in the tab, persisted when
 * the dialog is submitted.
 */
export interface IExperimentalTabState {
    values?: IConfigOptionValues;
}
