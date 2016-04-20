/* global config, APP */
/*
 * Copyright @ 2015 Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import VideoLayout from '../UI/videolayout/VideoLayout';
import Feedback from '../UI/Feedback.js';
import Toolbar from '../UI/toolbars/Toolbar';
import BottomToolbar from '../UI/toolbars/BottomToolbar';

const _RECORDER_CUSTOM_ROLE = "recorder-role";

class Recorder {
    /**
     * Initializes a new {Recorder} instance.
     *
     * @param conference the {conference} which is to transport
     * {Recorder}-related information between participants
     */
    constructor (conference) {
        this._conference = conference;

        // If I am a recorder then I publish my recorder custom role to notify
        // everyone.
        if (config.iAmRecorder) {
            VideoLayout.enableDeviceAvailabilityIcons(conference.localId, true);
            this._publishMyRecorderRole();
            Feedback.enableFeedback(false);
            Toolbar.enable(false);
            BottomToolbar.enable(false);
        }

        // Listen to "CUSTOM_ROLE" commands.
        this._conference.commands.addCommandListener(
            this._conference.commands.defaults.CUSTOM_ROLE,
            this._onCustomRoleCommand.bind(this));
    }

    /**
     * Publish the recorder custom role.
     * @private
     */
    _publishMyRecorderRole () {
        var conference = this._conference;

        var commands = conference.commands;

        commands.removeCommand(commands.defaults.CUSTOM_ROLE);
        var self = this;
        commands.sendCommandOnce(
            commands.defaults.CUSTOM_ROLE,
            {
                attributes: {
                    recorderRole: true
                }
            });
    }

    /**
     * Notifies this instance about a &qout;Custom Role&qout; command (delivered
     * by the Command(s) API of {this._conference}).
     *
     * @param attributes the attributes {Object} carried by the command
     * @param id the identifier of the participant who issued the command. A
     * notable idiosyncrasy of the Command(s) API to be mindful of here is that
     * the command may be issued by the local participant.
     */
    _onCustomRoleCommand ({ attributes }, id) {
        // We require to know who issued the command because (1) only a
        // moderator is allowed to send commands and (2) a command MUST be
        // issued by a defined commander.
        if (typeof id === 'undefined'
            || this._conference.isLocalId(id)
            || !attributes.recorderRole)
            return;

        var isRecorder = (attributes.recorderRole == 'true');

        if (isRecorder)
            VideoLayout.enableDeviceAvailabilityIcons(id, isRecorder);
    }
}

export default Recorder;
