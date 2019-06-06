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

import WatchKit
import WatchConnectivity
import Foundation


class InterfaceController: WKInterfaceController {

    @IBOutlet var infoLabel: WKInterfaceLabel!
    @IBOutlet var table: WKInterfaceTable!

    override func didAppear(){
        self.updateUI(ExtensionDelegate.currentJitsiMeetContext)
    }

    func updateUI(_ newContext:JitsiMeetContext) {
      if (newContext.recentURLs == nil || newContext.recentURLs!.count == 0) {
        infoLabel.setText("There are no recent meetings. Please use the app on the phone to start a new call.")

        table.setHidden(true)
        infoLabel.setHidden(false)
      } else {
        updateRecents(withRecents: newContext.recentURLs!, currentContext: newContext)

        table.setHidden(false)
        infoLabel.setHidden(true)
      }
    }

    private func updateRecents(withRecents recents: NSArray, currentContext: JitsiMeetContext) {
        // Updating the # of rows only if it actually changed prevents from blinking the UI
        if (table.numberOfRows != recents.count) {
            table.setNumberOfRows(recents.count, withRowType: "MeetingRowType")
        }

        for (index, entry) in recents.enumerated() {
            let entryDict = entry as! NSDictionary
            let roomURL = entryDict["conference"] as! NSString
            let timestamp = entryDict["date"] as! NSNumber

            // Prepare values
            let room = roomURL.components(separatedBy: "/").last
            let date = Date(timeIntervalSince1970: timestamp.doubleValue / 1000)  // timestamp is taken with Date.now() in JS, which uses milliseconds
            let dateFormatter = DateFormatter()
            dateFormatter.timeZone = TimeZone.current
            dateFormatter.locale = NSLocale.current
            dateFormatter.dateFormat = "HH:mm yyyy-MM-dd"
            let strDate = dateFormatter.string(from: date)

            // Update row controller
            let controller = table.rowController(at: index) as! MeetingRowController
            controller.room = room
            controller.roomUrl = roomURL as String
            controller.roomLabel.setText(room)
            controller.timeLabel.setText(strDate)

            // Change the background for the active meeting
            if (controller.roomUrl == currentContext.conferenceURL) {
                controller.rowGroup.setBackgroundColor(UIColor(red: 0.125, green: 0.58, blue: 0.98, alpha: 1))
            } else {
                controller.rowGroup.setBackgroundColor(UIColor(red: 0.949, green: 0.956, blue: 1, alpha: 0.14))
            }
        }
    }

    override func contextForSegue(withIdentifier segueIdentifier: String, in table: WKInterfaceTable, rowIndex: Int) -> Any? {
        let controller = table.rowController(at: rowIndex) as! MeetingRowController
        let currentContext = ExtensionDelegate.currentJitsiMeetContext

        // Copy the current context and add the joinConferenceURL to trigger the command when the in-call screen is displayed
        let actionContext = JitsiMeetContext(jmContext: currentContext)
        actionContext.joinConferenceURL = controller.roomUrl

        print("WATCH contextForSegue: \(actionContext.description)");

        return actionContext;
    }
}
