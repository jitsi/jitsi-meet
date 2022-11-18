//
//  MeetingState.swift
//  WidgetsExtension
//
//  Created by Alex Bumbu on 28.10.2022.
//

import Foundation

struct MeetingState: Decodable {
    var audioMuted: Bool
}

extension MeetingState {
    private static var stateFileURL: URL? {
        return FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.org.jitsi.meet.appgroup")?.appending(component: "widgetState")
    }
        
    static func load() -> MeetingState? {
        guard
            let stateFileURL = stateFileURL,
            let data = try? Data(contentsOf: stateFileURL)
        else {
            return nil
        }
        
        let decoder = PropertyListDecoder()
        return try? decoder.decode(MeetingState.self, from: data)
    }
}
