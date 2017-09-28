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

class ExtensionDelegate: NSObject, WCSessionDelegate, WKExtensionDelegate {

    func applicationDidFinishLaunching() {
      // Start Watch Connectivity
      if WCSession.isSupported() {
        let session  = WCSession.default
        session.delegate = self
        session.activate()
      }
    }

    func applicationDidBecomeActive() {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillResignActive() {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, etc.
    }

    func handle(_ backgroundTasks: Set<WKRefreshBackgroundTask>) {
        // Sent when the system needs to launch the application in the background to process tasks. Tasks arrive in a set, so loop through and process each one.
        for task in backgroundTasks {
            // Use a switch statement to check the task type
            switch task {
            case let backgroundTask as WKApplicationRefreshBackgroundTask:
                // Be sure to complete the background task once you’re done.
                backgroundTask.setTaskCompletedWithSnapshot(false)
            case let snapshotTask as WKSnapshotRefreshBackgroundTask:
                // Snapshot tasks have a unique completion call, make sure to set your expiration date
                snapshotTask.setTaskCompleted(restoredDefaultState: true, estimatedSnapshotExpiration: Date.distantFuture, userInfo: nil)
            case let connectivityTask as WKWatchConnectivityRefreshBackgroundTask:
                // Be sure to complete the connectivity task once you’re done.
                connectivityTask.setTaskCompletedWithSnapshot(false)
            case let urlSessionTask as WKURLSessionRefreshBackgroundTask:
                // Be sure to complete the URL session task once you’re done.
                urlSessionTask.setTaskCompletedWithSnapshot(false)
            default:
                // make sure to complete unhandled task types
                task.setTaskCompletedWithSnapshot(false)
            }
        }
    }
  
    func session(_ session: WCSession, activationDidCompleteWith
      activationState: WCSessionActivationState, error: Error?) {
      if let error = error {
        print("WC Session activation failed with error: \(error.localizedDescription)")
        return
      }
      print("WC Session activated with state: \(activationState.rawValue)")
    }
  
    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String : Any]) {
      
      print("WC SESSION DID RECEIVE APP CONTEXT");
      
      let conferenceURL = applicationContext["conferenceURL"] as? NSString ?? "NULL";
      print("CONFERENCE URL \(conferenceURL)");
      
      let micMuted = applicationContext["micMuted"] as? NSNumber ?? 0;
      print("MIC MUTED \(micMuted)");

      // Update recent URLs
      let recentURLs = applicationContext["recentURLs"];
      if let recentURLsArray = recentURLs as? NSArray {
        let controller = WKExtension.shared().rootInterfaceController as! InterfaceController
        controller.updateRecents(withRecents: recentURLsArray)
      }

      // If the current controller is not the in-call controller and we have a
      // conference URL, show the in-call controller
      if let currentController = WKExtension.shared().visibleInterfaceController as? InterfaceController {
          if conferenceURL != "NULL" {
              let room = conferenceURL.components(separatedBy: "/").last
              let context = ["room" : room, "roomUrl" : conferenceURL as String!, "skipJoin" : "true", "muted" : micMuted.boolValue.description ]
              DispatchQueue.main.async {
                   currentController.pushController(withName: "InCallController", context: context)
              }
          }
      } else if let controller = WKExtension.shared().visibleInterfaceController as? InCallController {
          if conferenceURL == "NULL" {
              DispatchQueue.main.async {
                  controller.popToRootController()
              }
          } else {
            // Update muted state
            controller.updateMutedButton(withMuted: micMuted.boolValue)
          }
      }
    }

}
