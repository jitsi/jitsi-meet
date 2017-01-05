#import "POSIX.h"

#include <arpa/inet.h>
#include <netdb.h>
#include <sys/types.h>
#include <sys/socket.h>

@implementation POSIX

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(getaddrinfo:(NSString *)hostname
                      resolve:(RCTPromiseResolveBlock)resolve
                       reject:(RCTPromiseRejectBlock)reject) {
    int err;
    struct addrinfo *res;
    NSString *rejectCode;

    if (0 == (err = getaddrinfo(hostname.UTF8String, NULL, NULL, &res))) {
        int af = res->ai_family;
        struct sockaddr *sa = res->ai_addr;
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
            char v[MAX(INET_ADDRSTRLEN, INET6_ADDRSTRLEN)];

            if (inet_ntop(af, addr, v, sizeof(v))) {
                resolve([NSString stringWithUTF8String:v]);
            } else {
                err = errno;
                rejectCode = @"inet_ntop";
            }
        } else {
            err = EAFNOSUPPORT;
            rejectCode = @"EAFNOSUPPORT";
        }

        freeaddrinfo(res);
    } else {
        rejectCode = @"getaddrinfo";
    }
    if (0 != err) {
        NSError *error
            = [NSError errorWithDomain:NSPOSIXErrorDomain
                                  code:err
                              userInfo:nil];

        reject(rejectCode, error.localizedDescription, error);
    }
}

@end
