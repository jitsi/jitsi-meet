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
    private var pendingMuteActions = Set<UUID>()

    internal override init() {}

    // MARK: - Add/remove listeners

    func addListener(_ listener: JMCallKitListener) {
        let wrapper = JMCallKitEventListenerWrapper(listener: listener)
        listeners.insert(wrapper)
    }

    func removeListener(_ listener: JMCallKitListener) {
        // XXX Constructing a new JMCallKitEventListenerWrapper instance in
        // order to remove the specified listener from listeners is (1) a bit
        // funny (though may make a statement about performance) and (2) not
        // really an option because the specified listener may already be
        // executing its dealloc (like RNCallKit).
        listeners.forEach {
            // 1. JMCallKitEventListenerWrapper weakly references
            //    JMCallKitListener so it may be nice to clean
            //    JMCallKitEventListenerWrapperinstances up if they've lost
            //    their associated JMCallKitListener instances (e.g. for
            //    example, because whoever did addListener forgot to
            //    removeListener). Unfortunately, I don't know how to do it
            //    because JMCallKitEventListenerWrapper is a struct.
            //
            // 2. XXX JMCallKitEventListenerWrapper implements the weird
            //    equality by JMCallKitListener hash which (1) I don't
            //    understand and (2) I don't know how to invoke without
            //    duplicating.
            if ($0.hashValue == listener.hash) {
                listeners.remove($0)
            }
        }
    }

    // MARK: - Add mute action

    func addMuteAction(_ actionUUID: UUID) {
        pendingMuteActions.insert(actionUUID)
    }

    // MARK: - CXProviderDelegate

    func providerDidReset(_ provider: CXProvider) {
        listeners.forEach { $0.listener?.providerDidReset?() }
        pendingMuteActions.removeAll()
    }

    func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        listeners.forEach {
            $0.listener?.performAnswerCall?(UUID: action.callUUID)
        }

        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        listeners.forEach {
            $0.listener?.performEndCall?(UUID: action.callUUID)
        }

        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
        let uuid = pendingMuteActions.remove(action.uuid)

        // XXX avoid mute actions ping-pong: if the mute action was caused by
        // the JS side (we requested a transaction) don't call the delegate
        // method. If it was called by the provder itself (when the user presses
        // the mute button in the CallKit view) then call the delegate method.
        if (uuid == nil) {
            listeners.forEach {
                $0.listener?.performSetMutedCall?(UUID: action.callUUID,
                                                isMuted: action.isMuted)
            }
        }

        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
        listeners.forEach {
            $0.listener?.performStartCall?(UUID: action.callUUID,
                                           isVideo: action.isVideo)
        }

        action.fulfill()
    }

    func provider(_ provider: CXProvider,
                  didActivate audioSession: AVAudioSession) {
        listeners.forEach {
            $0.listener?.providerDidActivateAudioSession?(session: audioSession)
        }
    }

    func provider(_ provider: CXProvider,
                  didDeactivate audioSession: AVAudioSession) {
        listeners.forEach {
            $0.listener?.providerDidDeactivateAudioSession?(
                session: audioSession)
        }
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
