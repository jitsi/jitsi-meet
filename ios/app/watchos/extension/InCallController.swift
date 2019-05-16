/*
 * Copyright @ 2018-present 8x8, Inc.
 * Copyright @ 2017-2018 Atlassian Pty Ltd
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

import WatchConnectivity
import WatchKit
import Foundation


class InCallController: WKInterfaceController {
    @IBOutlet var mutedButton: WKInterfaceButton!
    @IBOutlet var roomLabel: WKInterfaceLabel!
    @IBOutlet var timer: WKInterfaceTimer!

    @IBAction func hangupClicked() {
      sendCommand(JitsiMeetCommands.CMD_HANG_UP, message: nil)
    }

    @IBAction func muteClicked() {
        if var micMuted = ExtensionDelegate.currentJitsiMeetContext.micMuted {
            micMuted = !micMuted;
            sendCommand(
                JitsiMeetCommands.CMD_SET_MUTED,
                message: [
                  "muted": micMuted ? "true" : "false"
                ])
            updateMutedButton(withMuted: micMuted)
        }
    }

  func sendCommand(_ command: JitsiMeetCommands, message: [String : Any]?) {
        if WCSession.isSupported() {
            let session = WCSession.default
            var data = [String: Any]()

            if let sessionID = ExtensionDelegate.currentJitsiMeetContext.sessionID {
                if message != nil {
                    message!.forEach { data[$0] = $1 }
                }
              
                data["command"] = command.rawValue;
                data["sessionID"] = sessionID;
              
                session.sendMessage(data, replyHandler: nil, errorHandler: nil)
            }
        }
    }
  
    func updateUI(_ newContext: JitsiMeetContext) {
        var conferenceURL = newContext.conferenceURL

        if let joinConferenceURL = newContext.joinConferenceURL {
            sendCommand(JitsiMeetCommands.CMD_JOIN_CONFERENCE, message: [ "data" : joinConferenceURL ])
            conferenceURL = joinConferenceURL
        }

        let newRoomName = conferenceURL != nil ? conferenceURL!.components(separatedBy: "/").last : ""
      
        roomLabel.setText(newRoomName)
      
        if let newTimestamp = newContext.conferenceTimestamp {
            restartTimer(newTimestamp)
        }
        if let newMuted = newContext.micMuted {
            updateMutedButton(withMuted: newMuted)
        }
    }

    func restartTimer(_ conferenceTimestamp: Int64) {
        if (conferenceTimestamp != 0) {
            let newDate = Date(timeIntervalSince1970: TimeInterval(conferenceTimestamp / 1000))
            timer.setDate(newDate)
            timer.start();
            print("WATCH timer set date to: \(newDate) and start")
        } else {
            print("WATCH timer stop")
            timer.stop();
        }
    }

    func updateMutedButton(withMuted isMuted: Bool) {
      if isMuted {
          mutedButton.setBackgroundImageNamed("mute-on.png")
      } else {
          mutedButton.setBackgroundImageNamed("mute-off.png")
      }
    }

    override func awake(withContext context: Any?) {
        super.awake(withContext: context)

        if let data = context as? JitsiMeetContext {
          updateUI(data)
        }
    }
}
