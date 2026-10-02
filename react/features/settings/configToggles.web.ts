import { isBrowserPiPConfigurable } from '../pip/functions';

import { IConfigToggle } from './types';

/**
 * The config options the user can switch on or off from the Config tab of the settings dialog. Adding an entry here
 * is all it takes to expose a boolean config option: the tab, the persistence of the choice and its application to
 * the config are generic. The tab is hidden when no entry applies.
 */
export const CONFIG_TOGGLES: IConfigToggle[] = [
    {
        configPath: 'pip.enableBrowserPiP',
        descriptionKey: 'settings.pictureInPictureDescription',
        experimental: true,
        isAvailable: isBrowserPiPConfigurable,
        labelKey: 'settings.pictureInPicture'
    }
];
