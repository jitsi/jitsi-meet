/*
 * Copyright @ 2021-present 8x8, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <sys/socket.h>
#include <sys/un.h>

#import "SocketConnection.h"

@interface SocketConnection () <NSStreamDelegate>

@property (nonatomic, copy) NSString *filePath;

@property (nonatomic, strong) NSInputStream *inputStream;
@property (nonatomic, strong) NSOutputStream *outputStream;

@property (nonatomic, strong) NSThread *networkThread;

@end

@implementation SocketConnection {
  int _socket;
  struct sockaddr_un _socketAddr;
}

- (instancetype)initWithFilePath:(NSString *)path {
  self = [super init];
  if (self) {
    self.filePath = path;
    
    [self setupSocketWithFilePath:path];
    [self setupNetworkThread];
  }
  
  return self;
}

- (BOOL)open {
  NSLog(@"Open socket connection");
  
  if (![[NSFileManager defaultManager] fileExistsAtPath:self.filePath]) {
      NSLog(@"failure: socket file missing");
      return false;
  }

  int status = connect(_socket, (struct sockaddr *)&_socketAddr, sizeof(_socketAddr));
  if (status < 0) {
      NSLog(@"failure: socket connect (%d)", status);
      return false;
  }
  
  [self.networkThread start];

  CFReadStreamRef readStream;
  CFWriteStreamRef writeStream;

  CFStreamCreatePairWithSocket(kCFAllocatorDefault, _socket, &readStream, &writeStream);

  self.inputStream = (__bridge_transfer NSInputStream *)readStream;
  self.inputStream.delegate = self;
  [self.inputStream setProperty:@"kCFBooleanTrue" forKey:@"kCFStreamPropertyShouldCloseNativeSocket"];

  self.outputStream = (__bridge_transfer NSOutputStream *)writeStream;
  self.outputStream.delegate = self;
  [self.outputStream setProperty:@"kCFBooleanTrue" forKey:@"kCFStreamPropertyShouldCloseNativeSocket"];
  
  [self performSelector:@selector(scheduleStreams) onThread:self.networkThread withObject:nil waitUntilDone:true];

  [self.inputStream open];
  [self.outputStream open];

  NSLog(@"read stream status: %ld", CFReadStreamGetStatus(readStream));
  NSLog(@"write stream status: %ld", CFWriteStreamGetStatus(writeStream));
  
  return true;
}

- (void)close {
  [self performSelector:@selector(unscheduleStreams) onThread:self.networkThread withObject:nil waitUntilDone:true];

  self.inputStream.delegate = nil;
  self.outputStream.delegate = nil;
  
  [self.inputStream close];
  [self.outputStream close];

  [self.networkThread cancel];
}

- (NSInteger)writeBufferToStream:(const uint8_t*)buffer maxLength:(NSInteger)length {
  return [self.outputStream write:buffer maxLength:length];
}

// MARK: Private Methods

- (BOOL)isOpen {
  return self.inputStream.streamStatus == NSStreamStatusOpen && self.outputStream.streamStatus == NSStreamStatusOpen;
}

- (void)setupSocketWithFilePath:(NSString*)path {
  _socket = socket(AF_UNIX, SOCK_STREAM, 0);
  
  memset(&_socketAddr, 0, sizeof(_socketAddr));
  _socketAddr.sun_family = AF_UNIX;
  strncpy(_socketAddr.sun_path, path.UTF8String, sizeof(_socketAddr.sun_path) - 1);
}

- (void)setupNetworkThread {
  self.networkThread = [[NSThread alloc] initWithBlock:^{
    do {
      @autoreleasepool {
        [[NSRunLoop currentRunLoop] run];
      }
    } while (![NSThread currentThread].isCancelled);
  }];
  self.networkThread.qualityOfService = NSQualityOfServiceUserInitiated;
}

- (void)scheduleStreams {
  [self.inputStream scheduleInRunLoop:NSRunLoop.currentRunLoop forMode:NSRunLoopCommonModes];
  [self.outputStream scheduleInRunLoop:NSRunLoop.currentRunLoop forMode:NSRunLoopCommonModes];
}

- (void)unscheduleStreams {
  [self.inputStream removeFromRunLoop:NSRunLoop.currentRunLoop forMode:NSRunLoopCommonModes];
  [self.outputStream removeFromRunLoop:NSRunLoop.currentRunLoop forMode:NSRunLoopCommonModes];
}

- (void)notifyDidClose:(NSError *)error {
  if (self.didClose) {
    self.didClose(error);
  }
}

@end

#pragma mark - NSStreamDelegate

@implementation SocketConnection (NSStreamDelegate)

- (void)stream:(NSStream *)aStream handleEvent:(NSStreamEvent)eventCode {
  switch (eventCode) {
    case NSStreamEventOpenCompleted:
      NSLog(@"client stream open completed");
      if (aStream == self.outputStream && self.didOpen) {
        self.didOpen();
      }
      break;
    case NSStreamEventHasBytesAvailable:
      if (aStream == self.inputStream) {
        uint8_t buffer;
        NSInteger numberOfBytesRead = [(NSInputStream *)aStream read:&buffer maxLength:sizeof(buffer)];
        if (!numberOfBytesRead && aStream.streamStatus == NSStreamStatusAtEnd) {
          NSLog(@"server socket closed");
          [self close];
          [self notifyDidClose:nil];
        }
      }
      break;
    case NSStreamEventHasSpaceAvailable:
      if (aStream == self.outputStream && self.streamHasSpaceAvailable) {
        NSLog(@"client stream has space available");
        self.streamHasSpaceAvailable();
      }
      break;
    case NSStreamEventErrorOccurred:
      NSLog(@"client stream error occurred: %@", aStream.streamError);
      [self close];
      [self notifyDidClose:aStream.streamError];
      break;
      
    default:
      break;
  }
}

@end
