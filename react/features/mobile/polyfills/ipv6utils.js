import { NativeModules } from 'react-native';
import { RTCSessionDescription } from 'react-native-webrtc';

/**
 * Synthesizes IPv6 addresses on iOS in order to support IPv6 NAT64 networks.
 *
 * @param {RTCSessionDescription} sdp - The RTCSessionDescription which
 * specifies the configuration of the remote end of the connection.
 * @private
 * @returns {Promise}
 */
export function synthesizeIPv6Addresses(sdp) {
    return (
        new Promise(resolve => resolve(_synthesizeIPv6Addresses0(sdp)))
            .then(({ ips, lines }) =>
                Promise.all(Array.from(ips.values()))
                    .then(() => _synthesizeIPv6Addresses1(sdp, ips, lines))
            ));
}

/* eslint-disable max-depth */

/**
 * Synthesizes an IPv6 address from a specific IPv4 address.
 *
 * @param {string} ipv4 - The IPv4 address from which an IPv6 address is to be
 * synthesized.
 * @returns {Promise<?string>} A {@code Promise} which gets resolved with the
 * IPv6 address synthesized from the specified {@code ipv4} or a falsy value to
 * be treated as inability to synthesize an IPv6 address from the specified
 * {@code ipv4}.
 */
const _synthesizeIPv6FromIPv4Address = (function() {
    // POSIX.getaddrinfo
    const { POSIX } = NativeModules;

    if (POSIX) {
        const { getaddrinfo } = POSIX;

        if (typeof getaddrinfo === 'function') {
            return ipv4 =>
                getaddrinfo(/* hostname */ ipv4, /* servname */ undefined)
                    .then(([ { ai_addr: ipv6 } ]) => ipv6);
        }
    }

    // NAT64AddrInfo.getIPv6Address
    const { NAT64AddrInfo } = NativeModules;

    if (NAT64AddrInfo) {
        const { getIPv6Address } = NAT64AddrInfo;

        if (typeof getIPv6Address === 'function') {
            return getIPv6Address;
        }
    }

    // There's no POSIX.getaddrinfo or NAT64AddrInfo.getIPv6Address.
    return ip => Promise.resolve(ip);
})();

/**
 * Begins the asynchronous synthesis of IPv6 addresses.
 *
 * @param {RTCSessionDescription} sessionDescription - The RTCSessionDescription
 * for which IPv6 addresses will be synthesized.
 * @private
 * @returns {{
 *     ips: Map,
 *     lines: Array
 * }}
 */
function _synthesizeIPv6Addresses0(sessionDescription) {
    const sdp = sessionDescription.sdp;
    let start = 0;
    const lines = [];
    const ips = new Map();

    do {
        const end = sdp.indexOf('\r\n', start);
        let line;

        if (end === -1) {
            line = sdp.substring(start);

            // Break out of the loop at the end of the iteration.
            start = undefined;
        } else {
            line = sdp.substring(start, end);
            start = end + 2;
        }

        if (line.startsWith('a=candidate:')) {
            const candidate = line.split(' ');

            if (candidate.length >= 10 && candidate[6] === 'typ') {
                const ip4s = [ candidate[4] ];
                let abort = false;

                for (let i = 8; i < candidate.length; ++i) {
                    if (candidate[i] === 'raddr') {
                        ip4s.push(candidate[++i]);
                        break;
                    }
                }

                for (const ip of ip4s) {
                    if (ip.indexOf(':') === -1) {
                        ips.has(ip)
                            || ips.set(ip, new Promise((resolve, reject) => {
                                const v = ips.get(ip);

                                if (v && typeof v === 'string') {
                                    resolve(v);
                                } else {
                                    _synthesizeIPv6FromIPv4Address(ip).then(
                                        value => {
                                            if (!value
                                                    || value.indexOf(':') === -1
                                                    || value === ips.get(ip)) {
                                                ips.delete(ip);
                                            } else {
                                                ips.set(ip, value);
                                            }
                                            resolve(value);
                                        },
                                        reject);
                                }
                            }));
                    } else {
                        abort = true;
                        break;
                    }
                }
                if (abort) {
                    ips.clear();
                    break;
                }

                line = candidate;
            }
        }

        lines.push(line);
    } while (start);

    return {
        ips,
        lines
    };
}

/* eslint-enable max-depth */

/**
 * Completes the asynchronous synthesis of IPv6 addresses.
 *
 * @param {RTCSessionDescription} sessionDescription - The RTCSessionDescription
 * for which IPv6 addresses are being synthesized.
 * @param {Map} ips - A Map of IPv4 addresses found in the specified
 * sessionDescription to synthesized IPv6 addresses.
 * @param {Array} lines - The lines of the specified sessionDescription.
 * @private
 * @returns {RTCSessionDescription} A RTCSessionDescription that represents the
 * result of the synthesis of IPv6 addresses.
 */
function _synthesizeIPv6Addresses1(sessionDescription, ips, lines) {
    if (ips.size === 0) {
        return sessionDescription;
    }

    for (let l = 0; l < lines.length; ++l) {
        const candidate = lines[l];

        if (typeof candidate !== 'string') {
            let ip4 = candidate[4];
            let ip6 = ips.get(ip4);

            ip6 && (candidate[4] = ip6);

            for (let i = 8; i < candidate.length; ++i) {
                if (candidate[i] === 'raddr') {
                    ip4 = candidate[++i];
                    (ip6 = ips.get(ip4)) && (candidate[i] = ip6);
                    break;
                }
            }

            lines[l] = candidate.join(' ');
        }
    }

    return new RTCSessionDescription({
        sdp: lines.join('\r\n'),
        type: sessionDescription.type
    });
}
