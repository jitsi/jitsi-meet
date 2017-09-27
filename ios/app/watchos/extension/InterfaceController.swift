//
//  InterfaceController.swift
//  JitsiMeetCompanion Extension
//
//  Created by Saul Corretge on 9/27/17.
//  Copyright © 2017 Facebook. All rights reserved.
//

import WatchConnectivity
import WatchKit
import Foundation


class InterfaceController: WKInterfaceController {
    @IBAction func testClicked() {
        if WCSession.isSupported() {
          let session = WCSession.default
          session.sendMessage(["conference": "https://meet.jit.si/WatchyMcWatchFace"], replyHandler: nil, errorHandler: nil)
        }
    }
    
    override func awake(withContext context: Any?) {
        super.awake(withContext: context)
        
        // Configure interface objects here.
    }
    
    override func willActivate() {
        // This method is called when watch view controller is about to be visible to user
        super.willActivate()
    }
    
    override func didDeactivate() {
        // This method is called when watch view controller is no longer visible
        super.didDeactivate()
    }

}
