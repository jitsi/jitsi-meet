/*
 * Copyright @ 2019-present 8x8, Inc.
 * Copyright @ 2018-2019 Atlassian Pty Ltd
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

import CallKit
import Foundation

/// JitsiMeet CallKit proxy
// NOTE: The methods this class exposes are meant to be called in the UI thread.
// All delegate methods called by JMCallKitEmitter will be called in the UI thread.
@objc public final class JMCallKitProxy: NSObject {

    private override init() {}

    // MARK: - CallKit proxy

    private static var provider: CXProvider = {
        let configuration = CXProviderConfiguration(localizedName: "")
        return CXProvider(configuration: configuration)
    }()

    private static var providerConfiguration: CXProviderConfiguration? {
        didSet {
            guard let configuration = providerConfiguration else { return }
            provider.configuration = configuration
            provider.setDelegate(emitter, queue: nil)
        }
    }

    private static let callController: CXCallController = {
        return CXCallController()
    }()

    private static let emitter: JMCallKitEmitter = {
        return JMCallKitEmitter()
    }()

    /// Enables the proxy in between CallKit and the consumers of the SDK.
    /// Defaults to enabled, set to false when you don't want to use CallKit.
    @objc public static var enabled: Bool = true {
        didSet {
            provider.invalidate()
            if enabled {
                guard isProviderConfigured() else  { return; }
                provider = CXProvider(configuration: providerConfiguration!)
                provider.setDelegate(emitter, queue: nil)
            } else {
                provider.setDelegate(nil, queue: nil)
            }
        }
    }

    @objc public static func configureProvider(localizedName: String,
                                               ringtoneSound: String?,
                                               iconTemplateImageData: Data?) {
        guard enabled else { return }

        let configuration = CXProviderConfiguration(localizedName: localizedName)
        configuration.iconTemplateImageData = iconTemplateImageData
        configuration.maximumCallGroups = 1
        configuration.maximumCallsPerCallGroup = 1
        configuration.ringtoneSound = ringtoneSound
        configuration.supportedHandleTypes = [CXHandle.HandleType.generic]
        configuration.supportsVideo = true

        providerConfiguration = configuration
    }

    @objc public static func isProviderConfigured() -> Bool {
        return providerConfiguration != nil
    }

    @objc public static func addListener(_ listener: JMCallKitListener) {
        emitter.addListener(listener)
    }

    @objc public static func removeListener(_ listener: JMCallKitListener) {
        emitter.removeListener(listener)
    }

    @objc public static func hasActiveCallForUUID(_ callUUID: String) -> Bool {
        let activeCallForUUID = callController.callObserver.calls.first {
            $0.uuid == UUID(uuidString: callUUID)
        }
        guard activeCallForUUID != nil else { return false }
        return true
    }

    @objc public static func reportNewIncomingCall(
            UUID: UUID,
            handle: String?,
            displayName: String?,
            hasVideo: Bool,
            completion: @escaping (Error?) -> Void) {
        guard enabled else { return }

        let callUpdate = makeCXUpdate(handle: handle,
                                      displayName: displayName,
                                      hasVideo: hasVideo)
        provider.reportNewIncomingCall(with: UUID,
                                       update: callUpdate,
                                       completion: completion)
    }

    @objc public static func reportCallUpdate(with UUID: UUID,
                                              handle: String?,
                                              displayName: String?,
                                              hasVideo: Bool) {
        guard enabled else { return }

        let callUpdate = makeCXUpdate(handle: handle,
                                      displayName: displayName,
                                      hasVideo: hasVideo)
        provider.reportCall(with: UUID, updated: callUpdate)
    }

    @objc public static func reportCall(
            with UUID: UUID,
            endedAt dateEnded: Date?,
            reason endedReason: CXCallEndedReason) {
        guard enabled else { return }

        provider.reportCall(with: UUID,
                            endedAt: dateEnded,
                            reason: endedReason)
    }

    @objc public static func reportOutgoingCall(
            with UUID: UUID,
            startedConnectingAt dateStartedConnecting: Date?) {
        guard enabled else { return }

        provider.reportOutgoingCall(with: UUID,
                                    startedConnectingAt: dateStartedConnecting)
    }

    @objc public static func reportOutgoingCall(
            with UUID: UUID,
            connectedAt dateConnected: Date?) {
        guard enabled else { return }

        provider.reportOutgoingCall(with: UUID, connectedAt: dateConnected)
    }

    @objc public static func request(
            _ transaction: CXTransaction,
            completion: @escaping (Error?) -> Swift.Void) {
        guard enabled else { return }

        // XXX keep track of muted actions to avoid "ping-pong"ing. See
        // JMCallKitEmitter for details on the CXSetMutedCallAction handling.
        for action in transaction.actions {
            if (action as? CXSetMutedCallAction) != nil {
                emitter.addMuteAction(action.uuid)
            }
        }

        callController.request(transaction, completion: completion)
    }

    // MARK: - Callkit Proxy helpers

    private static func makeCXUpdate(handle: String?,
                                     displayName: String?,
                                     hasVideo: Bool) -> CXCallUpdate {
        let update = CXCallUpdate()
        update.supportsDTMF = false
        update.supportsHolding = false
        update.supportsGrouping = false
        update.supportsUngrouping = false
        update.hasVideo = hasVideo

        if let handle = handle {
            update.remoteHandle = CXHandle(type: .generic,
                                           value: handle)
        }

        if let displayName = displayName {
            update.localizedCallerName = displayName
        }

        return update
    }
}

