//
//  LockScreenMuteAudioWidget.swift
//  WidgetsExtension
//
//  Created by Alex Bumbu on 31.10.2022.
//

import SwiftUI
import WidgetKit

struct LockScreenMuteAudioWidget: Widget {
    let kind: String = "LockScreenMuteAudioWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            WidgetsEntryView(entry: entry)
        }
        .configurationDisplayName("Mute Jitsi Audio Widget")
        .description("This is a lockscreen widget for muting or unmuting the audio for the ongoing Jitsi meeting.")
        .supportedFamilies([.accessoryCircular])
    }
}

//struct LockScreenMuteAudioWidget_Preview: PreviewProvider {
//    static var previews: some View {
//        let meetingState = MeetingState(audioMuted: true)
//        
//        WidgetsEntryView(entry: CurrentMeetingEntry(date: Date(), meetingState: meetingState))
//            .previewContext(WidgetPreviewContext(family: .accessoryInline))
//            .previewDisplayName("Inline")
//        
//        WidgetsEntryView(entry: CurrentMeetingEntry(date: Date(), meetingState: meetingState))
//            .previewContext(WidgetPreviewContext(family: .accessoryCircular))
//            .previewDisplayName("Circular")
//        
//        WidgetsEntryView(entry: CurrentMeetingEntry(date: Date(), meetingState: meetingState))
//            .previewContext(WidgetPreviewContext(family: .accessoryRectangular))
//            .previewDisplayName("Rectangular")
//    }
//}

private struct WidgetsEntryView: View {
    @Environment(\.widgetFamily) var widgetFamily
    var entry: Provider.Entry
        
    var body: some View {
        if let meetingState = entry.meetingState {
            switch widgetFamily {
            case .accessoryInline:
                Text("Some meeting name")
            case .accessoryRectangular:
                AccessoryCircularWidgetView(audioMuted: meetingState.audioMuted)
            case .accessoryCircular:
                AccessoryCircularWidgetView(audioMuted: meetingState.audioMuted)
            default:
                EmptyView()
            }
        } else {
            EmptyView()
        }
    }
}

private struct AccessoryRectangularWidgetView: View {
    var audioMuted: Bool
    
    var body: some View {
        let imageName: String = audioMuted ? "microphone_on" : "microphone_off"
        let caption: String = audioMuted ? "Unmute \naudio" : "Mute \naudio"
        HStack {
            Image(imageName)
                .resizable()
                .aspectRatio(contentMode: .fit)
            Text(caption)
        }.widgetURL(URL(string: "meet/toggleAudioMute")!)
    }
}

private struct AccessoryCircularWidgetView: View {
    var audioMuted: Bool
    
    var body: some View {
        let imageName: String = audioMuted ? "microphone_on" : "microphone_off"
        Image(imageName)
            .resizable()
            .aspectRatio(contentMode: .fit)
            .widgetURL(URL(string: "meet/toggleAudioMute")!)
    }
}
