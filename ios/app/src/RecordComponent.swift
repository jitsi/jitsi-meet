//
//  RecordComponent.swift
//  jitsi-meet
//
//  Created by Varun Bansal on 05/06/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation
import Socket
import CoreVideo
import ReplayKit


@available(iOS 12.0, *)
@objc(RecordComponent)
class RecordComponent: RCTViewManager {
  var renderedView: CustomBroadcastPickerView? = nil;
  var frameQueue: QueueStack<String> = QueueStack<String>()

  @objc func recEnded() -> Void {
    print("the connection can close now");
    self.renderedView?.onEnd!(["event": "end"]) // add handlers for ? and ! to avoid app crash
  }
  
  @objc func recStarted() -> Void {
    print("send message to RN to switch track to screen sharing");
    self.renderedView?.onStart!(["event": "start"]) // add handlers for ? and ! to avoid app crash
    print("message sent to RN")
  }
  
  @objc func buttonClicked() {
    print("picker view button was opened")
    SocketShim.waitforExtConnection(inst: self);
  }
  
  override func view() -> UIView! {
    if #available(iOS 12.0, *) {
      let pickerView = CustomBroadcastPickerView(
               frame: CGRect(x: 0, y: 0, width: 200, height: 52))
      pickerView.preferredExtension = "de.hopp-foundation.screenshare.ScreenRecorderHopp"
      pickerView.showsMicrophoneButton = false
      pickerView.translatesAutoresizingMaskIntoConstraints = false
      if let button = pickerView.subviews.first as? UIButton {
        button.setTitle("Start Sharing", for: .normal)
        button.setTitleColor(UIColor.black, for: .normal)
//        button.imageView?.backgroundColor = UIColor.red
        button.addTarget(self, action: #selector(self.buttonClicked), for: .touchUpInside)
      }
      renderedView = pickerView
      var ciContext = CIContext()
      if (SocketShim.ciContext == nil) {
        SocketShim.ciContext = ciContext
      }
      return pickerView
    } else {
      let label = UILabel()
      label.text = "Screen Recording Not Supported"
      return label
    }
  }
}
