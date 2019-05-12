/*
 * Copyright 2017 Google
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "FIRUtilities.h"

// Plist file name.
NSString *const kGoogleServiceInfoFileName = @"GoogleService-Info";
// Plist file type.
NSString *const kGoogleServiceInfoFileType = @"plist";
NSString *const kGoogleAppIDPlistKey = @"GOOGLE_APP_ID";


@implementation FIRUtilities

+ (BOOL)appContainsRealServiceInfoPlist {
  static BOOL containsRealServiceInfoPlist = NO;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSBundle *bundle = [NSBundle mainBundle];
    containsRealServiceInfoPlist = [self containsRealServiceInfoPlistInBundle:bundle];
  });
  return containsRealServiceInfoPlist;
}

+ (BOOL)containsRealServiceInfoPlistInBundle:(NSBundle *)bundle {
  NSString *bundlePath = bundle.bundlePath;
  if (!bundlePath.length) {
    return NO;
  }

  NSString *plistFilePath = [bundle pathForResource:kGoogleServiceInfoFileName
                                             ofType:kGoogleServiceInfoFileType];
  if (!plistFilePath.length) {
    return NO;
  }

  NSDictionary *plist = [NSDictionary dictionaryWithContentsOfFile:plistFilePath];
  if (!plist) {
    return NO;
  }

  // Perform a very naive validation by checking to see if the plist has the dummy google app id
  NSString *googleAppID = plist[kGoogleAppIDPlistKey];
  if (!googleAppID.length) {
    return NO;
  }

  return YES;
}

+ (NSURL *)extractURL: (FIRDynamicLink*)dynamicLink {
  NSURL *url = nil;
  if (dynamicLink != nil) {
    NSURL *dynamicLinkURL = dynamicLink.url;
    if (dynamicLinkURL != nil
        && (dynamicLink.matchType == FIRDLMatchTypeUnique
            || dynamicLink.matchType == FIRDLMatchTypeDefault)) {
          // Strong match, process it.
          url = dynamicLinkURL;
        }
  }

  return url;
}

@end
