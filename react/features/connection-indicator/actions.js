import getRoomName from '../base/config/getRoomName';
import { downloadJSON } from '../base/util/downloadJSON';


/**
 * Create an action for saving the conference logs.
 *
 * @returns {Function}
 */
export function saveLogs() {
    return (dispatch, getState) => {
        // this can be called from console and will not have reference to this
        // that's why we reference the global var
        const logs = getState()['features/base/connection'].connection.getLogs();
        const roomName = getRoomName() || '';

        downloadJSON(logs, `meetlog-${roomName}.json`);
    };
}
