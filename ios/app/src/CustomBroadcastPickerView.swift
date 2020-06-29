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
class CustomBroadcastPickerView: RPSystemBroadcastPickerView {
  @objc var onUpdate: RCTDirectEventBlock?
  
  @objc func frameRecieved(_ frameData: String) {
    print("frameData.count \(frameData.count)")
    if onUpdate != nil {
      onUpdate!(["frameData": frameData])
    } else {
      print("on update was null")
    }
  }
}
