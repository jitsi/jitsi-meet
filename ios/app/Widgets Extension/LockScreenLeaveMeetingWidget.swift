//
//  LockScreenLeaveMeetingWidget.swift
//  WidgetsExtension
//
//  Created by Alex Bumbu on 31.10.2022.
//

import SwiftUI
import WidgetKit

struct LockScreenLeaveMeetingWidget: Widget {
    let kind: String = "LockScreenLeaveMeetingWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            WidgetsEntryView(entry: entry)
        }
        .configurationDisplayName("Leave Jitsi Meeting Widget")
        .description("This is a lockscreen widget for leaving the ongoing Jitsi meeting.")
        .supportedFamilies([.accessoryCircular])
    }
}

//struct LockScreenLeaveMeetingWidget_Preview: PreviewProvider {
//    static var previews: some View {
//        let meetingState = MeetingState(audioMuted: true)
//
//        WidgetsEntryView(entry: CurrentMeetingEntry(date: Date(), meetingState: meetingState))
//            .previewContext(WidgetPreviewContext(family: .accessoryCircular))
//            .previewDisplayName("Circular")
//    }
//}

private struct WidgetsEntryView: View {
    @Environment(\.widgetFamily) var widgetFamily
    var entry: Provider.Entry
        
    var body: some View {
        if entry.meetingState != nil, widgetFamily == .accessoryCircular {
            AccessoryCircularWidgetView()
        } else {
            EmptyView()
        }
    }
}

private struct AccessoryCircularWidgetView: View {
    var body: some View {
        Image("leave_meeting")
            .resizable()
            .aspectRatio(contentMode: .fit)
            .widgetURL(URL(string: "meet/leaveMeeting")!)
    }
}
