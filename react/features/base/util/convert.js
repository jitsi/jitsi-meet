// @flow

import jitsiLocalStorage from '../../../../modules/util/JitsiLocalStorage';
const logger = require('jitsi-meet-logger').getLogger(__filename);
/**
 * 
 */
export function convertForTrans(uri: ?string) {
    const displayName = jitsiLocalStorage.getItem("roomName_"+uri.toLowerCase().replace(/\s+/g,""));
    logger.info("convertForTrans uri:"+"roomName_"+uri.toLowerCase()+" displayName:"+displayName);
    if( displayName && displayName.length > 0){
        return displayName;
    }

    return uri;
}