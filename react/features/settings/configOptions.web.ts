import { IConfig } from '../base/config/configType';
import { isBrowserPiPConfigurable } from '../pip/functions';

import { ConfigOption } from './types';

/**
 * The config options the user can change from the Experimental tab of the settings dialog. Adding an entry here is all it
 * takes to expose a config option: the tab, the persistence of the choice and its application to the config are
 * generic. The tab is hidden when no entry applies.
 */
export const CONFIG_OPTIONS: ConfigOption[] = [
    {
        descriptionKey: 'settings.pictureInPictureDescription',
        getValue: config => Boolean(config.pip?.enableBrowserPiP),
        id: 'browserPiP',
        isAvailable: isBrowserPiPConfigurable,
        labelKey: 'settings.pictureInPicture',
        toConfig: (value): IConfig => ({ pip: { enableBrowserPiP: value } }),
        type: 'boolean'
    }
];
