import { IConfig } from '../base/config/configType';

/**
 * The properties shared by every config option the user can choose a value for, whatever the kind of value it holds.
 *
 * @template T - The type of the option's value.
 */
interface IConfigOptionBase<T> {

    /**
     * The key under which the user's choice is persisted. It is deliberately not the path of the config option, so
     * that a rename of the config option does not lose the choices users have already made. A deployment lists it in
     * {@code settingsDialog.disabledExperimentalTabOptions} to stop users from deciding the option.
     */
    id: string;

    /**
     * Returns the partial config that applies the given value. Annotate the return type of the implementation with
     * {@code IConfig}: TypeScript then also reports a misspelled config key next to a correct one.
     */
    toConfig: (value: T) => IConfig;
}

/**
 * A config option that is either on or off.
 */
export interface IBooleanConfigOption extends IConfigOptionBase<boolean> {

    /**
     * The kind of value the option holds.
     */
    type: 'boolean';
}

/**
 * Any config option the user can choose a value for. To support a new kind of value, add its interface to this
 * union, a case validating its persisted value to {@code _toConfigPart} in functions.web.ts, and widen
 * {@code userSelectedConfig} in the settings reducer.
 */
export type ConfigOption = IBooleanConfigOption;
