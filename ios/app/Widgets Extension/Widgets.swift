//
//  Widgets.swift
//  Widgets
//
//  Created by Alex Bumbu on 17.10.2022.
//  Copyright © 2022 Facebook. All rights reserved.
//

import WidgetKit
import SwiftUI

@main
struct Widgets: WidgetBundle {
    @WidgetBundleBuilder
    var body: some Widget {
        LockScreenMuteAudioWidget()
        LockScreenLeaveMeetingWidget()
    }
}
