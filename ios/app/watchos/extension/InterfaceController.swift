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

import WatchKit
import Foundation


class InterfaceController: WKInterfaceController {

    @IBOutlet var table: WKInterfaceTable!
 
    func updateRecents(withRecents recents: NSArray) {
        table.setNumberOfRows(recents.count, withRowType: "MeetingRowType")
        for (index, entry) in recents.enumerated() {
            // FIXME possible runtime exception
            let entryDict = entry as! NSDictionary
            let roomURL = entryDict["roomURL"] as! NSString
            let timestamp = entryDict["timestamp"] as! NSNumber
          
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
            controller.roomUrl = roomURL as String!
            controller.roomLabel.setText(room)
            controller.timeLabel.setText(strDate)
      }
    }
  
    override func awake(withContext context: Any?) {
        super.awake(withContext: context)
    }
    
    override func willActivate() {
        // This method is called when watch view controller is about to be visible to user
        super.willActivate()
    }
    
    override func didDeactivate() {
        // This method is called when watch view controller is no longer visible
        super.didDeactivate()
    }

  override func contextForSegue(withIdentifier segueIdentifier: String, in table: WKInterfaceTable, rowIndex: Int) -> Any? {
      let controller = table.rowController(at: rowIndex) as! MeetingRowController
      return ["room" : controller.room, "roomUrl" : controller.roomUrl]
  }
}
