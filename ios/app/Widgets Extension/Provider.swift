//
//  Provider.swift
//  WidgetsExtension
//
//  Created by Alex Bumbu on 31.10.2022.
//

import WidgetKit
import SwiftUI

struct CurrentMeetingEntry: TimelineEntry {
    let date: Date
    var meetingState: MeetingState?
}

class Provider: TimelineProvider { 
    private var currentMeetingState: MeetingState? {
        return MeetingState.load()
    }
    
    func placeholder(in context: Context) -> CurrentMeetingEntry {
        CurrentMeetingEntry(date: Date(),
                            meetingState: MeetingState(audioMuted: false))
    }
    
    func getSnapshot(in context: Context, completion: @escaping (CurrentMeetingEntry) -> ()) {
        var meetingState = currentMeetingState
        if context.isPreview {
            meetingState = MeetingState(audioMuted: false)
        }
        
        let entry = CurrentMeetingEntry(date: Date(), meetingState: meetingState)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<CurrentMeetingEntry>) -> ()) {
        var entries: [CurrentMeetingEntry] = []
        let entry = CurrentMeetingEntry(date: Date(), meetingState: currentMeetingState)
        entries.append(entry)
        
        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }
}
