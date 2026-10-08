import { IConfig } from '../base/config/configType';

import { ConfigOption } from './types';

/**
 * The config options the user can choose a value for. Persisting the choice and applying it to the config are
 * generic, so an option is nothing more than an entry here.
 */
export const CONFIG_OPTIONS: ConfigOption[] = [
    {
        id: 'browserPiP',
        toConfig: (value): IConfig => ({ pip: { enableBrowserPiP: value } }),
        type: 'boolean'
    }
];
