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

#import <MessageUI/MessageUI.h>
#import <ReplayKit/ReplayKit.h>

#import "SampleUploader.h"
#import "SocketConnection.h"

static const NSInteger kBufferMaxLenght = 10 * 1024;

@interface SampleUploader ()

@property (nonatomic, assign) BOOL isReady;

@property (nonatomic, strong) dispatch_queue_t serialQueue;
@property (nonatomic, strong) SocketConnection *connection;
@property (nonatomic, strong) CIContext *imageContext;

@property (nonatomic, strong) NSData *dataToSend;
@property (nonatomic, assign) NSUInteger byteIndex;

@end

@implementation SampleUploader

- (instancetype)initWithConnection:(SocketConnection *)connection {
  self = [super init];
  if (self) {
    self.serialQueue = dispatch_queue_create("org.jitsi.meet.broadcast.sampleUploader", DISPATCH_QUEUE_SERIAL);
    
    self.connection = connection;
    [self setupConnection];
    
    self.imageContext = [[CIContext alloc] initWithOptions:nil];
    self.isReady = false;
  }
  
  return self;
}

- (void)sendSample:(CMSampleBufferRef)sampleBuffer {
  self.isReady = false;
  
  self.dataToSend = [self prepareSample:sampleBuffer];
  self.byteIndex = 0;
  
  dispatch_async(self.serialQueue, ^{
    [self sendData];
  });
}

// MARK: Private Methods

- (void)setupConnection {
  __weak __typeof(self) weakSelf = self;
  self.connection.didOpen = ^{
    weakSelf.isReady = true;
  };
  self.connection.streamHasSpaceAvailable = ^{
    dispatch_async(weakSelf.serialQueue, ^{
      weakSelf.isReady = ![weakSelf sendData];
    });
  };
}

/**
 This function downscales and converts to jpeg the provided sample buffer, then wraps the resulted image data into a CFHTTPMessageRef. Returns the serialized CFHTTPMessageRef.
 */
- (NSData *)prepareSample:(CMSampleBufferRef)sampleBuffer {
  CVImageBufferRef imageBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
    
  CVPixelBufferLockBaseAddress(imageBuffer, kCVPixelBufferLock_ReadOnly);
  
  CGFloat scaleFactor = 2;
  size_t width = CVPixelBufferGetWidth(imageBuffer)/scaleFactor;
  size_t height = CVPixelBufferGetHeight(imageBuffer)/scaleFactor;
    
  CGAffineTransform scaleTransform = CGAffineTransformMakeScale(1/scaleFactor, 1/scaleFactor);
  NSData *bufferData = [self jpegDataFromPixelBuffer:imageBuffer withScaling:scaleTransform];
  
  CVPixelBufferUnlockBaseAddress(imageBuffer, kCVPixelBufferLock_ReadOnly);
  
  if (bufferData) {
    CFHTTPMessageRef httpResponse = CFHTTPMessageCreateResponse(kCFAllocatorDefault, 200, NULL, kCFHTTPVersion1_1);
    CFHTTPMessageSetHeaderFieldValue(httpResponse, (__bridge CFStringRef)@"Content-Length", (__bridge CFStringRef)[NSString stringWithFormat:@"%ld", bufferData.length]);
    CFHTTPMessageSetHeaderFieldValue(httpResponse, (__bridge CFStringRef)@"Buffer-Width", (__bridge CFStringRef)[NSString stringWithFormat:@"%ld", width]);
    CFHTTPMessageSetHeaderFieldValue(httpResponse, (__bridge CFStringRef)@"Buffer-Height", (__bridge CFStringRef)[NSString stringWithFormat:@"%ld", height]);

    CFHTTPMessageSetBody(httpResponse, (__bridge CFDataRef)bufferData);

    CFDataRef serializedMessage = CFHTTPMessageCopySerializedMessage(httpResponse);
    CFRelease(httpResponse);
    
    return CFBridgingRelease(serializedMessage);
  }
  
  return nil;
}

- (BOOL)sendData {
  if (!self.dataToSend) {
    NSLog(@"no data to send");
    return false;
  }

  NSUInteger bytesLeft = self.dataToSend.length - self.byteIndex;
  
  NSInteger length = bytesLeft > kBufferMaxLenght ? kBufferMaxLenght : bytesLeft;
  uint8_t buffer[length];
  [self.dataToSend getBytes:&buffer range:NSMakeRange(self.byteIndex, length)];

  length = [self.connection writeBufferToStream:buffer maxLength:length];
  if (length > 0) {
    self.byteIndex += length;
    bytesLeft -= length;

    if (bytesLeft == 0) {
      NSLog(@"video sample processed successfully");
      self.dataToSend = nil;
      self.byteIndex = 0;
    }
  }
  else {
    NSLog(@"writeBufferToStream failure");
  }
  
  return true;
}

- (NSData *)jpegDataFromPixelBuffer:(CVPixelBufferRef)pixelBuffer withScaling:(CGAffineTransform)scaleTransform {
  CIImage *image = [[CIImage alloc] initWithCVPixelBuffer:pixelBuffer];
  image = [image imageByApplyingTransform:scaleTransform];
  
  NSDictionary *options = @{(NSString *)kCGImageDestinationLossyCompressionQuality: [NSNumber numberWithFloat:1.0]};
  NSData *imageData = [self.imageContext JPEGRepresentationOfImage:image
                                                        colorSpace:image.colorSpace
                                                           options:options];
  return imageData;
}

@end
