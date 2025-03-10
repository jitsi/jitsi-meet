/*
 * Copyright @ 2025-present 8x8, Inc.
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

import CoreSpotlight
import Intents
import MobileCoreServices
import UIKit

import JitsiMeetSDK

@objcMembers
class ViewController: UIViewController {
    
    override func loadView() {
        let jitsiView = JitsiMeetView(frame: UIScreen.main.bounds)
        self.view = jitsiView
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        guard let view = self.view as? JitsiMeetView else { return }
        view.delegate = self
        view.join(JitsiMeet.sharedInstance().getInitialConferenceOptions())
    }
    
    // MARK: - Helper Methods
    
    func terminate() {
        guard let view = self.view as? JitsiMeetView else { return }
        view.leave()
    }
}


extension ViewController: @preconcurrency JitsiMeetViewDelegate {

    // MARK: - Private Helper Methods
    
    private func onJitsiMeetViewDelegateEvent(_ name: String, withData data: [AnyHashable: Any]?) {
        NSLog("[%@:%d] JitsiMeetViewDelegate %@ %@", #file, #line, name, data ?? [:])
        
        #if DEBUG
        assert(Thread.isMainThread, "JitsiMeetViewDelegate \(name) method invoked on a non-main thread")
        #endif
    }

    // MARK: - JitsiMeetViewDelegate
    
    func conferenceJoined(_ data: [AnyHashable: Any]) {
        onJitsiMeetViewDelegateEvent("CONFERENCE_JOINED", withData: data)
        
        // Register a NSUserActivity for this conference so it can be invoked as a Siri shortcut.
        // Must match the one defined in Info.plist
        let userActivity = NSUserActivity(activityType: "org.jitsi.JitsiMeet.ios.conference")
        
        if let urlStr = data["url"] as? String,
           let url = URL(string: urlStr),
           let conference = url.pathComponents.last {
            
            userActivity.title = "Join \(conference)"
            userActivity.suggestedInvocationPhrase = "Join my Jitsi meeting"
            userActivity.userInfo = ["url": urlStr]
            userActivity.isEligibleForSearch = true
            userActivity.isEligibleForPrediction = true
            userActivity.persistentIdentifier = urlStr
            
            // Subtitle
            let attributes = CSSearchableItemAttributeSet(contentType: UTType.item)
            attributes.contentDescription = urlStr
            userActivity.contentAttributeSet = attributes
            
            self.userActivity = userActivity
            userActivity.becomeCurrent()
        }
    }
    
    func ready(toClose data: [AnyHashable: Any]) {
        onJitsiMeetViewDelegateEvent("READY_TO_CLOSE", withData: data)
    }
}
