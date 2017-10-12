/* global APP, config */

/**
 * The (name of the) command which transports the recorder info.
 */
const _USER_INFO_COMMAND = 'userinfo';

/**
 * The Recorder class is meant to take care of recorder related presence
 * commands.
 */
class Recorder {
    /**
     * Creates new recorder instance.
     */
    constructor() {
        if (config.iAmRecorder) {
            this._sendRecorderInfo();
        }
    }

    /**
     * Sends the information that this is a recorder through the presence.
     * @private
     */
    _sendRecorderInfo() {
        const commands = APP.conference.commands;

        // XXX The "Follow Me" command represents a snapshot of all states
        // which are to be followed so don't forget to removeCommand before
        // sendCommand!
        commands.removeCommand(_USER_INFO_COMMAND);
        commands.sendCommand(
            _USER_INFO_COMMAND,
            {
                attributes: {
                    xmlns: 'http://jitsi.org/jitmeet/userinfo',
                    robot: true
                }
            });
    }
}

export default Recorder;
