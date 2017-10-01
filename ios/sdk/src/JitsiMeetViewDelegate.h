/*
 * Copyright @ 2017-present Atlassian Pty Ltd
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

@protocol JitsiMeetViewDelegate <NSObject>

@optional

/**
 * Called when a joining a conference was unsuccessful or when there was an
 * error while in a conference.
 *
 * The `data` dictionary contains an `error` key describing the error and a
 * `url` key with the conference URL.
 */
- (void)conferenceFailed:(NSDictionary *)data;

/**
 * Called when a conference was joined.
 *
 * The `data` dictionary contains a `url` key with the conference URL.
 */
- (void)conferenceJoined:(NSDictionary *)data;

/**
 * Called when a conference was left.
 *
 * The `data` dictionary contains a `url` key with the conference URL.
 */
- (void)conferenceLeft:(NSDictionary *)data;

/**
 * Called before a conference is joined.
 *
 * The `data` dictionary contains a `url` key with the conference URL.
 */
- (void)conferenceWillJoin:(NSDictionary *)data;

/**
 * Called before a conference is left.
 *
 * The `data` dictionary contains a `url` key with the conference URL.
 */
- (void)conferenceWillLeave:(NSDictionary *)data;

/**
 * Called when loading the main configuration file from the Jitsi Meet
 * deployment file.
 *
 * The `data` dictionary contains an `error` key with the error and a `url` key
 * with the conference URL which necessitated the loading of the configuration
 * file.
 */
- (void)loadConfigError:(NSDictionary *)data;

@end
