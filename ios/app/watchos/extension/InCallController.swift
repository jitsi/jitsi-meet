/*
 * Copyright @ 2017-present Atlassian Pty Ltd
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

  var muted: Bool!
  
  @IBAction func hangupClicked() {
      sendMessage(["command": "hangup"])
      popToRootController()
  }

  @IBAction func muteClicked() {
      sendMessage(["command": "toggleMute"])
      updateMutedButton(withMuted: !muted)
  }
  
  func sendMessage(_ message: [String : Any]) {
      if WCSession.isSupported() {
          let session = WCSession.default
          session.sendMessage(message, replyHandler: nil, errorHandler: nil)
      }
  }

  func updateMutedButton(withMuted isMuted: Bool) {
    muted = isMuted
    if isMuted {
        mutedButton.setBackgroundImageNamed("mute-on.png")
    } else {
        mutedButton.setBackgroundImageNamed("mute-off.png")
    }
  }

  override func awake(withContext context: Any?) {
      super.awake(withContext: context)
        
      if let data = context as? [String : String] {
          if data["skipJoin"] != "yes" {
              sendMessage(["command": "joinConference", "data" : data["roomUrl"]!])
          }

          roomLabel.setText(data["room"]!)
          updateMutedButton(withMuted: data["muted"] == "true")
      }
  }

    override func willActivate() {
        // This method is called when watch view controller is about to be visible to user
        super.willActivate()
    }

    override func didAppear() {
        super.didAppear()
      
        timer.start()
    }
  
    override func didDeactivate() {
        // This method is called when watch view controller is no longer visible
        super.didDeactivate()
    }

}
