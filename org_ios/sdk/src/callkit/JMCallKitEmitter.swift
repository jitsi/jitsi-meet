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

    private let listeners = NSMutableArray()
    private var pendingMuteActions = Set<UUID>()

    internal override init() {}

    // MARK: - Add/remove listeners

    func addListener(_ listener: JMCallKitListener) {
        if (!listeners.contains(listener)) {
            listeners.add(listener)
        }
    }

    func removeListener(_ listener: JMCallKitListener) {
        listeners.remove(listener)
    }

    // MARK: - Add mute action

    func addMuteAction(_ actionUUID: UUID) {
        pendingMuteActions.insert(actionUUID)
    }

    // MARK: - CXProviderDelegate

    func providerDidReset(_ provider: CXProvider) {
        listeners.forEach {
            let listener = $0 as! JMCallKitListener
            listener.providerDidReset?()
        }
        pendingMuteActions.removeAll()
    }

    func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        listeners.forEach {
            let listener = $0 as! JMCallKitListener
            listener.performAnswerCall?(UUID: action.callUUID)
        }

        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        listeners.forEach {
            let listener = $0 as! JMCallKitListener
            listener.performEndCall?(UUID: action.callUUID)
        }

        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
        let uuid = pendingMuteActions.remove(action.uuid)

        // Avoid mute actions ping-pong: if the mute action was caused by
        // the JS side (we requested a transaction) don't call the delegate
        // method. If it was called by the provider itself (when the user presses
        // the mute button in the CallKit view) then call the delegate method.
        //
        // NOTE: don't try to be clever and remove this. Been there, done that.
        // Won't work.
        if (uuid == nil) {
            listeners.forEach {
                let listener = $0 as! JMCallKitListener
                listener.performSetMutedCall?(UUID: action.callUUID, isMuted: action.isMuted)
            }
        }

        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
        listeners.forEach {
            let listener = $0 as! JMCallKitListener
            listener.performStartCall?(UUID: action.callUUID, isVideo: action.isVideo)
        }

        action.fulfill()
    }

    func provider(_ provider: CXProvider,
                  didActivate audioSession: AVAudioSession) {
        listeners.forEach {
            let listener = $0 as! JMCallKitListener
            listener.providerDidActivateAudioSession?(session: audioSession)
        }
    }

    func provider(_ provider: CXProvider,
                  didDeactivate audioSession: AVAudioSession) {
        listeners.forEach {
            let listener = $0 as! JMCallKitListener
            listener.providerDidDeactivateAudioSession?(session: audioSession)
        }
    }
}
