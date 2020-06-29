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
      queue.async { [unowned self] in
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
              print("----------- trying to read")
              let firstContact = try connSock.read(into: &buffer)
              print("----------- \(firstContact)")
              pickerView.frameRecieved(buffer.base64EncodedString())
//              self.frameQueue.enqueue(buffer.base64EncodedString())
              print("----------- its over")
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
