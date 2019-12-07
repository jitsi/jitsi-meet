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

#import <React/RCTUtils.h>

#import "JitsiMeetConferenceOptions+Private.h"
#import "JitsiMeetUserInfo+Private.h"

/**
 * Backwards compatibility: turn the boolean property into a feature flag.
 */
static NSString *const WelcomePageEnabledFeatureFlag = @"welcomepage.enabled";


@implementation JitsiMeetConferenceOptionsBuilder {
    NSNumber *_audioOnly;
    NSNumber *_audioMuted;
    NSNumber *_videoMuted;
    NSMutableDictionary *_featureFlags;
}

@dynamic audioOnly;
@dynamic audioMuted;
@dynamic videoMuted;
@dynamic welcomePageEnabled;

- (instancetype)init {
    if (self = [super init]) {
        _serverURL = nil;
        _room = nil;
        _subject = nil;
        _token = nil;

        _colorScheme = nil;
        _featureFlags = [[NSMutableDictionary alloc] init];

        _audioOnly = nil;
        _audioMuted = nil;
        _videoMuted = nil;

        _userInfo = nil;
    }
    
    return self;
}

- (void)setFeatureFlag:(NSString *)flag withBoolean:(BOOL)value {
    [self setFeatureFlag:flag withValue:[NSNumber numberWithBool:value]];
}

- (void)setFeatureFlag:(NSString *)flag withValue:(id)value {
    _featureFlags[flag] = value;
}

#pragma mark - Dynamic properties

- (void)setAudioOnly:(BOOL)audioOnly {
    _audioOnly = [NSNumber numberWithBool:audioOnly];
}

- (BOOL)audioOnly {
    return _audioOnly && [_audioOnly boolValue];
}

- (void)setAudioMuted:(BOOL)audioMuted {
    _audioMuted = [NSNumber numberWithBool:audioMuted];
}

- (BOOL)audioMuted {
    return _audioMuted && [_audioMuted boolValue];
}

- (void)setVideoMuted:(BOOL)videoMuted {
    _videoMuted = [NSNumber numberWithBool:videoMuted];
}

- (BOOL)videoMuted {
    return _videoMuted && [_videoMuted boolValue];
}

- (void)setWelcomePageEnabled:(BOOL)welcomePageEnabled {
    [self setFeatureFlag:WelcomePageEnabledFeatureFlag
               withBoolean:welcomePageEnabled];
}

- (BOOL)welcomePageEnabled {
    NSNumber *n = _featureFlags[WelcomePageEnabledFeatureFlag];

    return n != nil ? [n boolValue] : NO;
}

#pragma mark - Private API

- (NSNumber *)getAudioOnly {
    return _audioOnly;
}

- (NSNumber *)getAudioMuted {
    return _audioMuted;
}

- (NSNumber *)getVideoMuted {
    return _videoMuted;
}

@end

@implementation JitsiMeetConferenceOptions {
    NSNumber *_audioOnly;
    NSNumber *_audioMuted;
    NSNumber *_videoMuted;
    NSDictionary *_featureFlags;
}

@dynamic audioOnly;
@dynamic audioMuted;
@dynamic videoMuted;
@dynamic welcomePageEnabled;

#pragma mark - Dynamic properties

- (BOOL)audioOnly {
    return _audioOnly && [_audioOnly boolValue];
}

- (BOOL)audioMuted {
    return _audioMuted && [_audioMuted boolValue];
}

- (BOOL)videoMuted {
    return _videoMuted && [_videoMuted boolValue];
}

- (BOOL)welcomePageEnabled {
    NSNumber *n = _featureFlags[WelcomePageEnabledFeatureFlag];

    return n != nil ? [n boolValue] : NO;
}

#pragma mark - Internal initializer

- (instancetype)initWithBuilder:(JitsiMeetConferenceOptionsBuilder *)builder {
    if (self = [super init]) {
        _serverURL = builder.serverURL;
        _room = builder.room;
        _subject = builder.subject;
        _token = builder.token;

        _colorScheme = builder.colorScheme;

        _audioOnly = [builder getAudioOnly];
        _audioMuted = [builder getAudioMuted];
        _videoMuted = [builder getVideoMuted];

        _featureFlags = [NSDictionary dictionaryWithDictionary:builder.featureFlags];

        _userInfo = builder.userInfo;
    }

    return self;
}

#pragma mark - API

+ (instancetype)fromBuilder:(void (^)(JitsiMeetConferenceOptionsBuilder *))initBlock {
    JitsiMeetConferenceOptionsBuilder *builder = [[JitsiMeetConferenceOptionsBuilder alloc] init];
    initBlock(builder);
    return [[JitsiMeetConferenceOptions alloc] initWithBuilder:builder];
}

#pragma mark - Private API

- (NSDictionary *)asProps {
    NSMutableDictionary *props = [[NSMutableDictionary alloc] init];

    props[@"flags"] = [NSMutableDictionary dictionaryWithDictionary:_featureFlags];

    if (_colorScheme != nil) {
        props[@"colorScheme"] = self.colorScheme;
    }

    NSMutableDictionary *config = [[NSMutableDictionary alloc] init];
    if (_audioOnly != nil) {
        config[@"startAudioOnly"] = @(self.audioOnly);
    }
    if (_audioMuted != nil) {
        config[@"startWithAudioMuted"] = @(self.audioMuted);
    }
    if (_videoMuted != nil) {
        config[@"startWithVideoMuted"] = @(self.videoMuted);
    }
    if (_subject != nil) {
        config[@"subject"] = self.subject;
    }

    NSMutableDictionary *urlProps = [[NSMutableDictionary alloc] init];

    // The room is fully qualified.
    if (_room != nil && [_room containsString:@"://"]) {
        urlProps[@"url"] = _room;
    } else {
        if (_serverURL != nil) {
            urlProps[@"serverURL"] = [_serverURL absoluteString];
        }

        if (_room != nil) {
            urlProps[@"room"] = _room;
        }
    }

    if (_token != nil) {
        urlProps[@"jwt"] = _token;
    }

    if (_userInfo != nil) {
        props[@"userInfo"] = [self.userInfo asDict];
    }

    urlProps[@"config"] = config;
    props[@"url"] = urlProps;

    return props;
}

@end
