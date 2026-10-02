import { IReduxState } from '../app/types';

/**
 * Describes a config option the user can switch on or off from the Config tab of the settings dialog.
 */
export interface IConfigToggle {

    /**
     * The dot-separated path of the boolean config option the toggle controls, for example
     * `pip.enableBrowserPiP`. The user's choice is persisted under this key as well.
     */
    configPath: string;

    /**
     * The translation key of the text explaining what the option does.
     */
    descriptionKey: string;

    /**
     * Whether the feature behind the option is experimental and should be marked as such.
     */
    experimental?: boolean;

    /**
     * Returns whether the toggle applies to the current environment and deployment. A toggle that does not apply is
     * neither displayed nor is a value persisted for it earlier applied.
     */
    isAvailable: (state: IReduxState) => boolean;

    /**
     * The translation key of the toggle's title.
     */
    labelKey: string;
}
