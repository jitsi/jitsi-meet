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

#import <React/RCTBridgeModule.h>

#include <arpa/inet.h>
#include <netdb.h>
#include <string.h>
#include <sys/types.h>
#include <sys/socket.h>

@interface POSIX : NSObject<RCTBridgeModule>
@end

@implementation POSIX

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(getaddrinfo:(NSString *)hostname
                     servname:(NSString *)servname
                      resolve:(RCTPromiseResolveBlock)resolve
                       reject:(RCTPromiseRejectBlock)reject) {
    int err;
    const char *hostname_ = hostname ? hostname.UTF8String : NULL;
    const char *servname_ = servname ? servname.UTF8String : NULL;
    struct addrinfo hints;
    struct addrinfo *res;
    NSString *rejectCode;

    memset(&hints, 0, sizeof(hints));
    hints.ai_family = PF_UNSPEC;
    hints.ai_flags = AI_DEFAULT;
    if (0 == (err = getaddrinfo(hostname_, servname_, &hints, &res))) {
        char addr_[MAX(INET_ADDRSTRLEN, INET6_ADDRSTRLEN)];
        NSMutableArray *res_ = [[NSMutableArray alloc] init];

        for (struct addrinfo *ai = res; ai; ai = ai->ai_next) {
            int af = ai->ai_family;
            struct sockaddr *sa = ai->ai_addr;
            void *addr;

            switch (af) {
            case AF_INET:
                addr = &(((struct sockaddr_in *) sa)->sin_addr);
                break;
            case AF_INET6:
                addr = &(((struct sockaddr_in6 *) sa)->sin6_addr);
                break;
            default:
                addr = NULL;
                break;
            }
            if (addr) {
                if (inet_ntop(af, addr, addr_, sizeof(addr_))) {
                    [res_ addObject:@{
                        @"ai_addr": [NSString stringWithUTF8String:addr_],
                        @"ai_family": [NSNumber numberWithInt:af],
                        @"ai_protocol":
                            [NSNumber numberWithInt:ai->ai_protocol],
                        @"ai_socktype": [NSNumber numberWithInt:ai->ai_socktype]
                    }];
                } else {
                    err = errno;
                    rejectCode = @"inet_ntop";
                }
            } else {
                err = EAFNOSUPPORT;
                rejectCode = @"EAFNOSUPPORT";
            }
        }

        freeaddrinfo(res);

        // resolve
        if (res_.count) {
            resolve(res_);
            return;
        }

        if (!err) {
            err = ERANGE;
            rejectCode = @"ERANGE";
        }
    } else {
        rejectCode = @"getaddrinfo";
    }

    // reject
    NSError *error
        = [NSError errorWithDomain:NSPOSIXErrorDomain
                              code:err
                          userInfo:nil];

    reject(rejectCode, error.localizedDescription, error);
}

@end
