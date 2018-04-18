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

import CallKit
import Foundation

/// JitsiMeet CallKit proxy
@available(iOS 10.0, *)
@objc public final class JMCallKitProxy: NSObject {
    
    override private init() {}
    
    // MARK: - CallKit proxy
    
    internal static let cxProvider: CXProvider = {
        let config = CXProviderConfiguration(localizedName: "")
        let provider = CXProvider(configuration: config)
        return provider
    }()
    
    internal static let cxCallController: CXCallController = {
        return CXCallController()
    }()
    
    internal static let callKitNotifier: JMCallKitNotifier = {
        return JMCallKitNotifier()
    }()
    
    internal static var cxProviderConfiguration: CXProviderConfiguration? {
        didSet {
            guard let providerConfiguration = cxProviderConfiguration else { return }
            cxProvider.configuration = providerConfiguration
            cxProvider.setDelegate(callKitNotifier, queue: nil)
        }
    }
    
    /// Enables the proxy in between callkit and the consumers of the SDK
    /// Default to enabled, set to false when you don't want to use callkit
    @objc public static var enabled: Bool = true {
        didSet {
            if enabled == false {
                cxProvider.setDelegate(nil, queue: nil)
            }
        }
    }
    
    @objc public static func hasProviderBeenConfigurated() -> Bool {
        return cxProviderConfiguration != nil
    }
        
    @objc public static func configureCallKitProvider(localizedName: String,
                                                      ringtoneSound: String?,
                                                      iconTemplateImageData: Data?) {
        let configuration = CXProviderConfiguration(localizedName: localizedName)
        configuration.ringtoneSound = ringtoneSound
        configuration.iconTemplateImageData = iconTemplateImageData
        
        configuration.maximumCallGroups = 1
        configuration.maximumCallsPerCallGroup = 1
        configuration.supportedHandleTypes = [CXHandle.HandleType.generic]
        configuration.supportsVideo = true
        cxProviderConfiguration = configuration
    }
    
    @objc public static func addListener(_ listener: JMCallKitEventListener) {
        callKitNotifier.addListener(listener)
    }
    
    @objc public static func removeListener(_ listener: JMCallKitEventListener) {
        callKitNotifier.removeListener(listener)
    }
    
    @objc public static func hasActiveCallForUUID(_ callUUID: String) -> Bool {
        let activeCallForUUID = cxCallController.callObserver.calls.first {
            $0.uuid == UUID(uuidString: callUUID)
        }
        guard activeCallForUUID != nil else { return false }
        return true
    }
    
    @objc public static func reportNewIncomingCall(UUID: UUID,
                                             handle: String?,
                                             displayName: String?,
                                             hasVideo: Bool,
                                             completion: @escaping (Error?) -> Void) {
        guard enabled else { return }
        
        let callUpdate = makeCXUpdate(handle: handle,
                                      displayName: displayName,
                                      hasVideo: hasVideo)
        cxProvider.reportNewIncomingCall(with: UUID,
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
        cxProvider.reportCall(with: UUID, updated: callUpdate)
    }
    
    @objc public static func reportCall(with UUID: UUID,
                           endedAt dateEnded: Date?,
                           reason endedReason: CXCallEndedReason) {
        guard enabled else { return }
        
        cxProvider.reportCall(with: UUID,
                              endedAt: dateEnded,
                              reason: endedReason)
    }
    
    @objc public static func reportOutgoingCall(with UUID: UUID,
          startedConnectingAt dateStartedConnecting: Date?) {
        guard enabled else { return }
        
        cxProvider.reportOutgoingCall(with: UUID,
                                      startedConnectingAt: dateStartedConnecting)
    }
    
    @objc public static func reportOutgoingCall(with UUID: UUID,
                                          connectedAt dateConnected: Date?) {
        guard enabled else { return }
        
        cxProvider.reportOutgoingCall(with: UUID, connectedAt: dateConnected)
    }
    
    @objc public static func request(_ transaction: CXTransaction,
                                completion: @escaping (Error?) -> Swift.Void) {
        guard enabled else { return }
        
        cxCallController.request(transaction, completion: completion)
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
