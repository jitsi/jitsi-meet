/*
 * Copyright @ 2018-present Atlassian Pty Ltd
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

import AVKit
import CallKit
import Foundation

@objc public protocol JMCallKitEventListener: NSObjectProtocol {
    
    @available(iOS 10.0, *)
    @objc optional func providerDidReset()
    
    @available(iOS 10.0, *)
    @objc optional func performAnswerCall(UUID: UUID)
    
    @available(iOS 10.0, *)
    @objc optional func performEndCall(UUID: UUID)
    
    @available(iOS 10.0, *)
    @objc optional func performSetMutedCall(UUID: UUID, isMuted: Bool)
    
    @available(iOS 10.0, *)
    @objc optional func performStartCall(UUID: UUID, isVideo: Bool)
    
    @available(iOS 10.0, *)
    @objc optional func providerDidActivateAudioSession(session: AVAudioSession)
    
    @available(iOS 10.0, *)
    @objc optional func providerDidDeactivateAudioSession(session: AVAudioSession)
    
    @available(iOS 10.0, *)
    @objc optional func providerTimedOutPerformingAction(action: CXAction)
}

internal struct JMCallKitEventListenerWrapper: Hashable {
    
    public var hashValue: Int
    
    internal weak var listener: JMCallKitEventListener?
    
    public init(listener: JMCallKitEventListener) {
        self.listener = listener
        self.hashValue = listener.hash
    }
    
    public static func ==(lhs: JMCallKitEventListenerWrapper,
                          rhs: JMCallKitEventListenerWrapper) -> Bool {
        return lhs.hashValue == rhs.hashValue
    }
}
