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


@objc(RecordComponent)
class RecordComponent: RCTViewManager {
  
  var frameQueue: QueueStack<String> = QueueStack<String>()
  
  @objc func getFrame() -> String? {
    if !frameQueue.isEmpty {
      return frameQueue.dequeue()
    }
    return nil
  }
  
  override func view() -> UIView! {
    if #available(iOS 12.0, *) {
      let pickerView = CustomBroadcastPickerView(
               frame: CGRect(x: 0, y: 0, width: 50, height: 50))
      pickerView.preferredExtension = "de.hopp-foundation.screenshare.ScreenRecorderHopp"
      pickerView.translatesAutoresizingMaskIntoConstraints = false
      
      // Update the color of the Button
      // to make it visible clearly on a white background
      if let button = pickerView.subviews.first as? UIButton {
        button.imageView?.tintColor = UIColor.red
      }
      let fileManager = FileManager.default
      let queue = DispatchQueue.global(qos: .default)
      queue.async { [unowned self] in // remove this loop when recording ends.
        do {
          let connSock = try Socket.create(family: Socket.ProtocolFamily.unix, proto: Socket.SocketProtocol.unix)
          let socketFD = fileManager.containerURL(forSecurityApplicationGroupIdentifier: "group.org.reactjs.native.example.ScreenRecordingDemo")
          let filePath = socketFD?.absoluteURL.appendingPathComponent("socketFDNN", isDirectory: false)
          let sockSig = try Socket.Signature.init(socketType: Socket.SocketType.stream, proto: Socket.SocketProtocol.unix, path: filePath?.path ?? "")
          
          repeat {
            do {
              if !connSock.isConnected {
                print("trying to connect to server")
                sleep(4)
                try connSock.connect(using: sockSig!)
                continue
              }
              if !connSock.isActive {
                print("terminating connection")
                connSock.close()
                break
              }
              var buffer = Data.init()
//              print("----------- trying to read screen capture data")
              let firstContact = try connSock.read(into: &buffer)
//              print("----------- \(firstContact)")
              let cim = CIImage.init(data: buffer)
              var pixelBuffer: CVPixelBuffer?
              // not using below as not req now
//              let options = [kCVPixelBufferCGImageCompatibilityKey:true,
//                             kCVPixelBufferCGBitmapContextCompatibilityKey:true]
              let status = CVPixelBufferCreate(nil, Int(886 / 2), Int(1920 / 2), kCVPixelFormatType_32BGRA, nil, &pixelBuffer)
              // should do something with status to check if creation was successful
              if cim == nil || pixelBuffer == nil {
                return
              }
              CIContext().render(cim!, to: pixelBuffer!)
              SocketShim.pushPixelBuffer(pixelBuffer: pixelBuffer!)
                // below is when things were simpler in my head
//              videoFrame = RTCVideoFrame(pixelBuffer: pixelBuffer!, rotation: RTCVideoRotation._0, timeStampNs: Int64(timestamp))
//              let rtcPixelBuffer = RTCCVPixelBuffer.init(pixelBuffer:pixelBuffer!)
              
//              videoFrame = RTCVideoFrame(buffer: rtcPixelBuffer, rotation: RTCVideoRotation._0, timeStampNs: Int64(timestamp))
//              localVideoSource.capturer(videoCapturer, didCapture: videoFrame!)
//              pickerView.frameRecieved(buffer.base64EncodedString())
//              self.frameQueue.enqueue(buffer.base64EncodedString())
              print("----------- its all over")
            } catch {
              print("catch innsideee  innsideee \(error)")
//              break
            }
          } while true
        } catch {
          print ("catch inside \(error)")
        }
      }

      return pickerView
    } else {
      let label = UILabel()
      label.text = "Screen Recording Not Supported"
      return label
    }
  }
}
