import { BROWSER_PIP_OPTION_ID } from '../pip/constants';
import { isBrowserPiPConfigurable, isBrowserPiPTurnedOn } from '../pip/functions';

import { ConfigOption } from './types';

/**
 * The config options the user can change from the Experimental tab of the settings dialog. The tab and the
 * persistence of the choice are generic, so exposing a config option takes an entry here plus a feature that reads
 * the choice (see {@code isBrowserPiPTurnedOn}). The tab is hidden when no entry applies.
 */
export const CONFIG_OPTIONS: ConfigOption[] = [
    {
        descriptionKey: 'settings.pictureInPictureDescription',
        getValue: isBrowserPiPTurnedOn,
        id: BROWSER_PIP_OPTION_ID,
        isAvailable: isBrowserPiPConfigurable,
        labelKey: 'settings.pictureInPicture',
        type: 'boolean'
    }
];
