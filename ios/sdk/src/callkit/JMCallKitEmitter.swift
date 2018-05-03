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

internal final class JMCallKitEmitter: NSObject, CXProviderDelegate {

    private var listeners = Set<JMCallKitEventListenerWrapper>()

    internal override init() {}

    // MARK: - Add/remove listeners

    func addListener(_ listener: JMCallKitListener) {
        let wrapper = JMCallKitEventListenerWrapper(listener: listener)
        objc_sync_enter(listeners)
        listeners.insert(wrapper)
        objc_sync_exit(listeners)
    }

    func removeListener(_ listener: JMCallKitListener) {
        let wrapper = JMCallKitEventListenerWrapper(listener: listener)
        objc_sync_enter(listeners)
        listeners.remove(wrapper)
        objc_sync_exit(listeners)
    }

    // MARK: - CXProviderDelegate

    func providerDidReset(_ provider: CXProvider) {
        objc_sync_enter(listeners)
        listeners.forEach { $0.listener?.providerDidReset?() }
        objc_sync_exit(listeners)
    }

    func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        objc_sync_enter(listeners)
        listeners.forEach {
            $0.listener?.performAnswerCall?(UUID: action.callUUID)
        }
        objc_sync_exit(listeners)

        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        objc_sync_enter(listeners)
        listeners.forEach {
            $0.listener?.performEndCall?(UUID: action.callUUID)
        }
        objc_sync_exit(listeners)

        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
        objc_sync_enter(listeners)
        listeners.forEach {
            $0.listener?.performSetMutedCall?(UUID: action.callUUID,
                                              isMuted: action.isMuted)
        }
        objc_sync_exit(listeners)

        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
        objc_sync_enter(listeners)
        listeners.forEach {
            $0.listener?.performStartCall?(UUID: action.callUUID,
                                           isVideo: action.isVideo)
        }
        objc_sync_exit(listeners)

        action.fulfill()
    }

    func provider(_ provider: CXProvider,
                  didActivate audioSession: AVAudioSession) {
        objc_sync_enter(listeners)
        listeners.forEach {
            $0.listener?.providerDidActivateAudioSession?(session: audioSession)
        }
        objc_sync_exit(listeners)
    }

    func provider(_ provider: CXProvider,
                  didDeactivate audioSession: AVAudioSession) {
        objc_sync_enter(listeners)
        listeners.forEach {
            $0.listener?.providerDidDeactivateAudioSession?(
                session: audioSession)
        }
        objc_sync_exit(listeners)
    }
}

fileprivate struct JMCallKitEventListenerWrapper: Hashable {

    public var hashValue: Int

    internal weak var listener: JMCallKitListener?

    public init(listener: JMCallKitListener) {
        self.listener = listener
        self.hashValue = listener.hash
    }

    public static func ==(lhs: JMCallKitEventListenerWrapper,
                          rhs: JMCallKitEventListenerWrapper) -> Bool {
        // XXX We're aware that "[t]wo instances with equal hash values are not
        // necessarily equal to each other."
        return lhs.hashValue == rhs.hashValue
    }
}
