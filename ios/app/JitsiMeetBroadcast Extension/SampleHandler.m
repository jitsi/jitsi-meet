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

#import "SampleHandler.h"
#import "SocketConnection.h"
#import "SampleUploader.h"
#import "DarwinNotificationCenter.h"

@interface SampleHandler ()

@property (nonatomic, retain) SocketConnection *clientConnection;
@property (nonatomic, retain) SampleUploader *uploader;

@end

@implementation SampleHandler

- (instancetype)init {
  self = [super init];
  if (self) {
    self.clientConnection = [[SocketConnection alloc] initWithFilePath:self.socketFilePath];
    [self setupConnection];
    
    self.uploader = [[SampleUploader alloc] initWithConnection:self.clientConnection];    
  }
  
  return self;
}

- (void)broadcastStartedWithSetupInfo:(NSDictionary<NSString *,NSObject *> *)setupInfo {
  // User has requested to start the broadcast. Setup info from the UI extension can be supplied but optional.
  NSLog(@"broadcast started");
  
  [[DarwinNotificationCenter sharedInstance] postNotificationWithName:kBroadcastStartedNotification];
  [self openConnection];
}

- (void)broadcastPaused {
    // User has requested to pause the broadcast. Samples will stop being delivered.
}

- (void)broadcastResumed {
    // User has requested to resume the broadcast. Samples delivery will resume.
}

- (void)broadcastFinished {
    // User has requested to finish the broadcast.
  [[DarwinNotificationCenter sharedInstance] postNotificationWithName:kBroadcastStoppedNotification];
  [self.clientConnection close];
}

- (void)processSampleBuffer:(CMSampleBufferRef)sampleBuffer withType:(RPSampleBufferType)sampleBufferType {
  static NSUInteger frameCount = 0;
  switch (sampleBufferType) {
    case RPSampleBufferTypeVideo:
      // adjust frame rate by using every third frame
      if (++frameCount%3 == 0 && self.uploader.isReady) {
        [self.uploader sendSample:sampleBuffer];
      }
      break;

    default:
      break;
  }
}

// MARK: Private Methods

- (NSString *)socketFilePath {
    // the appGroupIdentifier must match the value provided in the app's info.plist for the RTCAppGroupIdentifier key
    NSString *appGroupIdentifier = @"group.org.jitsi.meet.appgroup";
    NSURL *sharedContainer = [[NSFileManager defaultManager] containerURLForSecurityApplicationGroupIdentifier:appGroupIdentifier];
    NSString *socketFilePath = [[sharedContainer URLByAppendingPathComponent:@"rtc_SSFD"] path];
      
    return socketFilePath;
}

- (void)setupConnection {
  __weak __typeof(self) weakSelf = self;
  self.clientConnection.didClose = ^(NSError *error) {
    NSLog(@"client connection did close: %@", error);
    if (error) {
      [weakSelf finishBroadcastWithError:error];
    }
    else {
      NSInteger JMScreenSharingStopped = 10001;
      NSError *customError = [NSError errorWithDomain:RPRecordingErrorDomain
                                                 code:JMScreenSharingStopped
                                             userInfo:@{NSLocalizedDescriptionKey: @"Screen sharing stopped"}];
      [weakSelf finishBroadcastWithError:customError];
    }
  };
}

- (void)openConnection {
  dispatch_queue_t queue = dispatch_queue_create("org.jitsi.meet.broadcast.connectTimer", 0);
  dispatch_source_t timer = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, queue);
  dispatch_source_set_timer(timer, dispatch_walltime(NULL, 0), 0.1 * NSEC_PER_SEC, 0.1 * NSEC_PER_SEC);
  
  dispatch_source_set_event_handler(timer, ^{
    BOOL success = [self.clientConnection open];
    if (success) {
      dispatch_source_cancel(timer);
    }
  });

  dispatch_resume(timer);
}

@end
