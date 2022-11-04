//
//  DarwinNotificationsObserver.swift
//  WidgetsExtension
//
//  Created by Alex Bumbu on 17.10.2022.
//

import Foundation

enum DarwinNotification: String {
    case meetingMutedChanged = "iOS_MeetingMutedChanged"
}

extension DarwinNotification {
    
    var name: String { rawValue }
}

class DarwinNotificationsObserver {
    
    private static var observers = Array<ProxyObserver>()
    
    private let queue = DispatchQueue(label: "org.jitsi.meet.darwinNotificationObserver", qos: .default, autoreleaseFrequency: .workItem)
    private var notificationCenter: CFNotificationCenter
    
    init() {
        notificationCenter = CFNotificationCenterGetDarwinNotifyCenter()
    }
    
    func observe(notification: DarwinNotification, handler: @escaping () -> Void) {
        let proxyObserver = ProxyObserver(observer: self, notificationName: notification.name, handler: handler)
        queue.async {
            DarwinNotificationsObserver.observers.append(proxyObserver)
        }
        
        let callback: CFNotificationCallback = { _, observer, name, _, _ in
            guard let observer = observer else {
                return
            }
            
            // Extract pointer to `observer` from void pointer:
            let proxyObserver = Unmanaged<ProxyObserver>.fromOpaque(observer).takeUnretainedValue()
            var observers = DarwinNotificationsObserver.observers
            if !proxyObserver.forwardNotification(), let index = observers.firstIndex(of: proxyObserver) {
                // cleanup if `forwardNotification` fails
                observers.remove(at: index)
            }
        }
        
        CFNotificationCenterAddObserver(notificationCenter,
                                        Unmanaged.passUnretained(proxyObserver).toOpaque(),
                                        callback,
                                        notification.name as CFString,
                                        nil,
                                        .deliverImmediately)
    }
    
    func stopObserving(notification: DarwinNotification) {
        queue.sync {
            DarwinNotificationsObserver.observers.removeAll { $0.observer == nil }
        }
        
        if let index = DarwinNotificationsObserver.observers.firstIndex(where: { $0.observer === self && $0.notificationName == notification.name }) {
            let proxyObserver = DarwinNotificationsObserver.observers[index]
            CFNotificationCenterRemoveObserver(notificationCenter,
                                               Unmanaged.passUnretained(proxyObserver).toOpaque(),
                                               CFNotificationName(notification.name as CFString),
                                               nil)
            queue.async {
                DarwinNotificationsObserver.observers.remove(at: index)
            }
        }
    }
}

private class ProxyObserver: Equatable {
    
    let notificationName: String
    weak var observer: AnyObject?
    
    private let handler: () -> (Void)
    
    static func == (lhs: ProxyObserver, rhs: ProxyObserver) -> Bool {
        lhs.observer === rhs.observer && lhs.notificationName == rhs.notificationName
    }
    
    init(observer: AnyObject? = nil, notificationName: String, handler: @escaping () -> Void) {
        self.notificationName = notificationName
        self.handler = handler
        self.observer = observer
    }
    
    func forwardNotification() -> Bool {
        guard observer != nil else {
            return false
        }
        
        handler()
        return true
    }
}
