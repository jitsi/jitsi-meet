import getRoomName from '../base/config/getRoomName';
import { downloadJSON } from '../base/util/downloadJSON';


/**
 * Create an action for saving the conference logs.
 *
 * @returns {Function}
 */
export function saveLogs() {
    return (dispatch, getState) => {

        const logs = getState()['features/base/connection'].connection.getLogs();
        const roomName = getRoomName() || '';

        downloadJSON(logs, `meetlog-${roomName}.json`);
    };
}
