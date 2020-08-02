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
import CoreVideo
import CoreImage


// because blueSocket doesnt support objc
@objc public class SocketShim: UIView {
  
  static var frameQueue: QueueStack<RTCVideoFrame> = QueueStack<RTCVideoFrame>()
  
  static var sampleFrame: RTCVideoFrame?
  
  static var ciContext: CIContext?
  
  static var isWaitingForConnection: Bool = false;
  static var isBroadcasting: Bool = false;
  @available(iOS 12.0, *)
  static var viewInst: RecordComponent?;
  
  @available(iOS 12.0, *)
  static func waitforExtConnection(inst: RecordComponent) {
    let fileManager = FileManager.default
    let queue = DispatchQueue.global(qos: .default)
    viewInst = inst
    if (SocketShim.isWaitingForConnection) {
      print("[SocketShim] already waiting for connection. exiting")
      return
    }
    if (SocketShim.isBroadcasting) {
      print("[SocketShim] already broadcasting. exiting")
      return
    }

    SocketShim.isWaitingForConnection = true
    var emptyFrameCount = 0;
    var waitingForConnectionCount = 0;

    queue.async { [inst] in // remove this loop when recording ends.
      do {
        let connSock = try Socket.create(family: Socket.ProtocolFamily.unix, proto: Socket.SocketProtocol.unix)
        let socketFD = fileManager.containerURL(forSecurityApplicationGroupIdentifier: "group.de.hopp-foundation.screenrecording")
        let filePath = socketFD?.absoluteURL.appendingPathComponent("socketFDNN", isDirectory: false)
        let sockSig = try Socket.Signature.init(socketType: Socket.SocketType.stream, proto: Socket.SocketProtocol.unix, path: filePath?.path ?? "")
        
        repeat {
          do {
            if !connSock.isConnected {
              if (waitingForConnectionCount > 5) {
                SocketShim.isWaitingForConnection = false
                print("[SocketShim] user did not start recording after opening the picker view")
                break
              }
              print("[SocketShim] trying to connect to server")
              sleep(4)
              waitingForConnectionCount = waitingForConnectionCount + 1
              try connSock.connect(using: sockSig!)
              inst.recStarted()
              print("[SocketShim] track switch started")
              continue
            }
            SocketShim.isWaitingForConnection = false
            SocketShim.isBroadcasting = true
            var buffer = Data.init()

            let firstContact = try connSock.read(into: &buffer)
            if firstContact == 0 {
              print("[SocketShim] empty data received from socket")
              emptyFrameCount = emptyFrameCount + 1
              if (emptyFrameCount > 500) {
                print("[SocketShim] stopp expecting frames")
                break
              }
            }
            if let jsonData = try? JSONDecoder().decode([String: String].self, from: buffer) {
              let height = jsonData["height"]
              let width = jsonData["width"]
              let b64Buffer = jsonData["b64"]
              let frameData = Data.init(base64Encoded: b64Buffer!)
              let cim = CIImage.init(data: frameData!)
              var pixelBuffer: CVPixelBuffer?
              _ = CVPixelBufferCreate(nil, Int(width!)!, Int(height!)!, kCVPixelFormatType_32BGRA, nil, &pixelBuffer)
              if SocketShim.ciContext == nil || pixelBuffer == nil || cim == nil {
                continue
              }
              SocketShim.ciContext!.render(cim!, to: pixelBuffer!)
              SocketShim.pushPixelBuffer(pixelBuffer: pixelBuffer!, rawData: buffer)
            }
            
//            print("[SocketShim] just pushed a frame, feeling pretty good")
          } catch {
            print("[SocketShim] some error has occurred \(error)")
          }
        } while true
        SocketShim.isBroadcasting = false
        print("[SocketShim] exiting loop")
        inst.recEnded()
      } catch {
        print("[SocketShim] some error has occurred \(error)")
      }
    }
  }
  
  @objc static func getNextFrame() -> RTCVideoFrame? {
      return sampleFrame
  }
  
  @objc static func isQueueEmpty() -> Bool {
    return frameQueue.isEmpty;
  }
  
  @objc static func pushPixelBuffer(pixelBuffer: CVPixelBuffer, rawData: Data) {
    var videoFrame:RTCVideoFrame?;
    let timestamp = NSDate().timeIntervalSince1970 * 1000000000 // Need timestamp in nano secs - Ns
    let rtcPixelBuffer = RTCCVPixelBuffer.init(pixelBuffer:pixelBuffer)
    
    videoFrame = RTCVideoFrame(buffer: rtcPixelBuffer, rotation: RTCVideoRotation._0, timeStampNs: Int64(timestamp))
//    self.frameQueue.enqueue(buffer.base64EncodedString())
//      print(" pushing video frame - \(videoFrame)")
      sampleFrame = videoFrame
//    return frameQueue.enqueue(videoFrame!)
  }
}
