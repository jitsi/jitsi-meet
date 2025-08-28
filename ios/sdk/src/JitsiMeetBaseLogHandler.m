/*
 * Copyright @ 2019-present 8x8, Inc.
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

#import "JitsiMeetBaseLogHandler+Private.h"

@interface PrivateLogger : DDAbstractLogger <DDLogger>
@end

@implementation PrivateLogger {
    JitsiMeetBaseLogHandler *_delegate;
}

- (instancetype)initWithDelegate:(JitsiMeetBaseLogHandler *)delegate {
    if (self = [super init]) {
        _delegate = delegate;
    }

    return self;
}

#pragma mark - DDAbstractLogger interface

- (void)logMessage:(DDLogMessage *)logMessage {
    NSString *logMsg = logMessage.message;
    
    if (_logFormatter)
        logMsg = [_logFormatter formatLogMessage:logMessage];
    
    if (logMsg && _delegate) {
        switch (logMessage.flag) {
            case DDLogFlagError:
                [_delegate logError:logMsg];
                break;
            case DDLogFlagWarning:
                [_delegate logWarn:logMsg];
                break;
            case DDLogFlagInfo:
                [_delegate logInfo:logMsg];
                break;
            case DDLogFlagDebug:
                [_delegate logDebug:logMsg];
                break;
            case DDLogFlagVerbose:
                [_delegate logVerbose:logMsg];
                break;
        }
    }
}

@end


@implementation JitsiMeetBaseLogHandler

#pragma mark - Proxy logger not to expose the CocoaLumberjack headers

- (instancetype)init {
    if (self = [super init]) {
        self.logger = [[PrivateLogger alloc] initWithDelegate:self];
    }

    return self;
}

#pragma mark - Public API

- (void)logVerbose:(NSString *)msg {
    // Override me!
    [self doesNotRecognizeSelector:_cmd];
}

- (void)logDebug:(NSString *)msg {
    // Override me!
    [self doesNotRecognizeSelector:_cmd];
}

- (void)logInfo:(NSString *)msg {
    // Override me!
    [self doesNotRecognizeSelector:_cmd];
}

- (void)logWarn:(NSString *)msg {
    // Override me!
    [self doesNotRecognizeSelector:_cmd];
}

- (void)logError:(NSString *)msg {
    // Override me!
    [self doesNotRecognizeSelector:_cmd];
}

@end
