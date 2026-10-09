import { IReduxState } from '../app/types';
import { IConfig } from '../base/config/configType';

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
     * Reads the effective value of the option from the config, which already includes the user's choice.
     */
    getValue: (config: IConfig) => T;

    /**
     * The key under which the user's choice is persisted. It is deliberately not the path of the config option, so
     * that a rename of the config option does not lose the choices users have already made.
     */
    id: string;

    /**
     * Returns whether the option applies to the current environment, e.g. whether the browser supports the feature.
     * An option that does not apply is not displayed, but a value the user chose for it earlier is still applied:
     * the feature is expected to ignore its flag where it cannot work. To stop users from deciding an option at all,
     * a deployment lists it in {@code settingsDialog.disabledExperimentalTabOptions} instead.
     */
    isAvailable: (state: IReduxState) => boolean;

    /**
     * The translation key of the option's title.
     */
    labelKey: string;

    /**
     * Returns the partial config that applies the given value. Annotate the return type of the implementation with
     * {@code IConfig}: TypeScript then also reports a misspelled config key next to a correct one.
     */
    toConfig: (value: T) => IConfig;
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
 * union, a case validating its persisted value to {@code _toConfigPart} in functions.web.ts, a case rendering its
 * control to {@code ExperimentalTab}, and widen {@code userSelectedConfig} in the settings reducer.
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
