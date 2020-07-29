//
//  CustomBroadcastPickerView.swift
//  jitsi-meet
//
//  Created by Varun Bansal on 29/06/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation
import ReplayKit


@available(iOS 12.0, *)
// not used now, remove at last
class CustomBroadcastPickerView: RPSystemBroadcastPickerView {
  @objc var onEnd: RCTDirectEventBlock?;
  @objc var onStart: RCTDirectEventBlock?;
}
