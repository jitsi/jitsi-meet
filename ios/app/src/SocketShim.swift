//
//  SocketShim.swift
//  jitsi-meet
//
//  Created by Varun Bansal on 08/07/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation
import Socket
import WebRTC


// because blueSocket doesnt support objc
@objc public class SocketShim: UIView {
  
  static var frameQueue: QueueStack<RTCVideoFrame> = QueueStack<RTCVideoFrame>()
  
  @objc static func getNextFrame() -> RTCVideoFrame? {
    let videoFrame = frameQueue.dequeue();
    return videoFrame
  }
  
  @objc static func isQueueEmpty() -> Bool {
    return frameQueue.isEmpty;
  }
  
  @objc static func pushPixelBuffer(pixelBuffer: CVPixelBuffer) {
    var videoFrame:RTCVideoFrame?;
    let timestamp = NSDate().timeIntervalSince1970 * 1000
//    videoFrame = RTCVideoFrame(pixelBuffer: pixelBuffer, rotation: RTCVideoRotation._0, timeStampNs: Int64(timestamp))
    let rtcPixelBuffer = RTCCVPixelBuffer.init(pixelBuffer:pixelBuffer)
    
    videoFrame = RTCVideoFrame(buffer: rtcPixelBuffer, rotation: RTCVideoRotation._0, timeStampNs: Int64(timestamp))
//    localVideoSource.capturer(videoCapturer, didCapture: videoFrame!)
//    pickerView.frameRecieved(buffer.base64EncodedString())
//    self.frameQueue.enqueue(buffer.base64EncodedString())

    return frameQueue.enqueue(videoFrame!)
  }

}
