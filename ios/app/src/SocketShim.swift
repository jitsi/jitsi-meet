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
  
  static var connSocket: Socket? = nil
  
  static var isWaitingForConnection: Bool = false;
  static var _closeSocket: Bool = false;
  static var isBroadcasting: Bool = false;
  @available(iOS 12.0, *)
  static var viewInst: RecordComponent?;
  
  @available(iOS 12.0, *)
  static func waitforExtConnection(inst: RecordComponent) {
    let fileManager = FileManager.default
    let queue = DispatchQueue.global(qos: .default)
    SocketShim._closeSocket = false
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
        var sockSig: Socket.Signature? = nil;
        
        repeat {
          do {
            if SocketShim.connSocket == nil {
              SocketShim.connSocket = try Socket.create(family: Socket.ProtocolFamily.unix, proto: Socket.SocketProtocol.unix)
            }
            if sockSig == nil {
              let socketFD = fileManager.containerURL(forSecurityApplicationGroupIdentifier: "group.de.hopp-foundation.screenrecording")
              let filePath = socketFD?.absoluteURL.appendingPathComponent("socketFDNN", isDirectory: false)
              sockSig = try Socket.Signature.init(socketType: Socket.SocketType.stream, proto: Socket.SocketProtocol.unix, path: filePath?.path ?? "")!
            }
            if !SocketShim.connSocket!.isConnected {
              //              if (waitingForConnectionCount > 5) {
              //                SocketShim.isWaitingForConnection = false
              //                print("[SocketShim] user did not start recording after opening the picker view")
              //                break
              //              }
              print("[SocketShim] trying to connect to server")
              sleep(3)
              waitingForConnectionCount = waitingForConnectionCount + 1
              try SocketShim.connSocket!.connect(using: sockSig!)
              //              inst.recStarted()
              ScreenShareController.getSingleton()?.recStarted();
              print("[SocketShim] track switch started")
              continue
            }
            SocketShim.isWaitingForConnection = false
            SocketShim.isBroadcasting = true
            var buffer = Data.init()
            
            let firstContact = try SocketShim.connSocket!.read(into: &buffer)
            if firstContact == 0 {
              print("[SocketShim] empty data received from socket or need to shut the socket close")
              emptyFrameCount = emptyFrameCount + 1
              if (emptyFrameCount > 500) {
                print("[SocketShim] stopp expecting frames")
                SocketShim.connSocket!.close()
                SocketShim.connSocket = nil
                sockSig = nil
                ScreenShareController.getSingleton()?.recStopped();
                SocketShim.isBroadcasting = false
                print("[SocketShim] exiting receiving frames")
                continue
              }
              continue
            }
            if SocketShim._closeSocket {
              SocketShim._closeSocket = false
              print("force close the socket to stop recording")
              SocketShim.connSocket!.close()
              SocketShim.connSocket = nil
              sockSig = nil
              ScreenShareController.getSingleton()?.recStopped();
              SocketShim.isBroadcasting = false
              print("[SocketShim] exiting receiving frames")
              continue
            }
            
            let rawBytes = [UInt8](buffer)
            let width : Int = Int(bigEndian: Data(bytes: rawBytes[firstContact - 8...firstContact - 1]).withUnsafeBytes {$0.pointee})
            var height : Int = Int(bigEndian: Data(bytes: rawBytes[firstContact - 16...firstContact - 9]).withUnsafeBytes {$0.pointee})
            var rotation = rawBytes[firstContact - 17]
            let bufferBytes = rawBytes[0...firstContact - 18]
            let bufferData = Data(bufferBytes)
            let cim = CIImage.init(data: bufferData)
            if cim != nil {
              var pixelBuffer: CVPixelBuffer?
              _ = CVPixelBufferCreate(nil, Int(width), Int(height), kCVPixelFormatType_32BGRA, nil, &pixelBuffer)
              if SocketShim.ciContext == nil || pixelBuffer == nil || cim == nil {
                continue
              }
              SocketShim.ciContext!.render(cim!, to: pixelBuffer!)
              SocketShim.pushPixelBuffer(pixelBuffer: pixelBuffer!, rotation:rotation)
            }
            
          } catch {
            print("[SocketShim] some error has occurred \(error)")
          }
        } while true
      } catch {
        print("[SocketShim] some error has occurred \(error)")
      }
    }
  }
  
  @objc static func closeSocket() -> Void {
    print("call ended")
    SocketShim._closeSocket = true
  }
  
  @objc static func getNextFrame() -> RTCVideoFrame? {
    return sampleFrame
  }
  
  @objc static func isQueueEmpty() -> Bool {
    return frameQueue.isEmpty;
  }
  
  @objc static func pushPixelBuffer(pixelBuffer: CVPixelBuffer, rotation: UInt8) {
    var videoFrame:RTCVideoFrame?;
    let timestamp = NSDate().timeIntervalSince1970 * 1000000000 // Need timestamp in nano secs - Ns
    let rtcPixelBuffer = RTCCVPixelBuffer.init(pixelBuffer:pixelBuffer)
    
    var rotationDegree:RTCVideoRotation;

    switch rotation{
      case 3:
          rotationDegree = RTCVideoRotation._180
      case 8:
          rotationDegree = RTCVideoRotation._90
      case 6:
        rotationDegree = RTCVideoRotation._270
      default:
          rotationDegree = RTCVideoRotation._0
    }
    print(rotationDegree)
    videoFrame = RTCVideoFrame(buffer: rtcPixelBuffer, rotation: rotationDegree, timeStampNs: Int64(timestamp))
    //    self.frameQueue.enqueue(buffer.base64EncodedString())
    //      print(" pushing video frame - \(videoFrame)")
    sampleFrame = videoFrame
    //    return frameQueue.enqueue(videoFrame!)
  }
}
