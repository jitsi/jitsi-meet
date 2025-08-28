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

import Foundation

class JitsiMeetContext {
    private var dictionary : [String : Any]

    var joinConferenceURL : String? = nil;

    init() {
        dictionary = [:]
    }
  
    init(context: [String : Any]) {
        dictionary = context
    }
  
    init(jmContext: JitsiMeetContext) {
        dictionary = jmContext.dictionary
        joinConferenceURL = jmContext.joinConferenceURL
    }
  
    var conferenceURL : String? {
        get {
            return dictionary["conferenceURL"] as? String
        }
    }
  
    var conferenceTimestamp : Int64? {
        get {
            return dictionary["conferenceTimestamp"] as? Int64;
        }
    }
  
    var sessionID : Int64? {
        get {
            return dictionary["sessionID"] as? Int64;
        }
    }
  
    var recentURLs : NSArray? {
        get {
            return dictionary["recentURLs"] as? NSArray
        }
    }
  
    var micMuted : Bool? {
        get {
            return (dictionary["micMuted"] as? NSNumber)?.boolValue ?? nil;
        }
    }
  
    public var description: String {
        return "JitsiMeetContext[conferenceURL: \(String(describing: conferenceURL)), conferenceTimestamp: \(String(describing:conferenceTimestamp)), sessionID: \(String(describing:sessionID)), recentURLs: \(String(describing:recentURLs)), joinConferenceURL: \(String(describing:joinConferenceURL)) "
    }
}
