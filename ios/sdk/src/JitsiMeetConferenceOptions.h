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

#import <Foundation/Foundation.h>

@interface JitsiMeetConferenceOptionsBuilder : NSObject

@property (nonatomic, copy, nullable) NSURL *serverURL;
@property (nonatomic, copy, nullable) NSString *room;
@property (nonatomic, copy, nullable) NSString *token;

@property (nonatomic, copy, nullable) NSDictionary *colorScheme;

@property (nonatomic) BOOL audioOnly;
@property (nonatomic) BOOL audioMuted;
@property (nonatomic) BOOL videoMuted;

@property (nonatomic) BOOL welcomePageEnabled;

@end

@interface JitsiMeetConferenceOptions : NSObject

@property (nonatomic, copy, nullable, readonly) NSURL *serverURL;
@property (nonatomic, copy, nullable, readonly) NSString *room;
@property (nonatomic, copy, nullable, readonly) NSString *token;

@property (nonatomic, copy, nullable) NSDictionary *colorScheme;

@property (nonatomic, readonly) BOOL audioOnly;
@property (nonatomic, readonly) BOOL audioMuted;
@property (nonatomic, readonly) BOOL videoMuted;

@property (nonatomic, readonly) BOOL welcomePageEnabled;

+ (instancetype)fromBuilder:(void (^)(JitsiMeetConferenceOptionsBuilder *))initBlock;
- (instancetype)init NS_UNAVAILABLE;

@end
