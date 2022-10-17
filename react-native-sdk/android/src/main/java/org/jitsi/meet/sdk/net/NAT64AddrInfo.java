/*
 * Copyright @ 2018-present Atlassian Pty Ltd
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
package org.jitsi.meet.sdk.net;

import java.net.InetAddress;
import java.net.UnknownHostException;

/**
 * Constructs IPv6 addresses for IPv4 addresses in the NAT64 environment.
 *
 * NAT64 translates IPv4 to IPv6 addresses by adding "well known" prefix and
 * suffix configured by the administrator. Those are figured out by discovering
 * both IPv6 and IPv4 addresses of a host and then trying to find a place where
 * the IPv4 address fits into the format described here:
 * https://tools.ietf.org/html/rfc6052#section-2.2
 */
public class NAT64AddrInfo {
    /**
     * Coverts bytes array to upper case HEX string.
     *
     * @param bytes an array of bytes to be converted
     * @return ex. "010AFF" for an array of {1, 10, 255}.
     */
    static String bytesToHexString(byte[] bytes) {
        StringBuilder hexStr = new StringBuilder();

        for (byte b : bytes) {
            hexStr.append(String.format("%02X", b));
        }

        return hexStr.toString();
    }

    /**
     * Tries to discover the NAT64 prefix/suffix based on the IPv4 and IPv6
     * addresses resolved for given {@code host}.
     *
     * @param host the host for which the code will try to discover IPv4 and
     * IPv6 addresses which then will be used to figure out the NAT64 prefix.
     * @return {@link NAT64AddrInfo} instance if the NAT64 prefix/suffix was
     * successfully discovered or {@code null} if it failed for any reason.
     * @throws UnknownHostException thrown by {@link InetAddress#getAllByName}.
     */
    public static NAT64AddrInfo discover(String host)
            throws UnknownHostException {
        InetAddress ipv4 = null;
        InetAddress ipv6 = null;

        for(InetAddress addr : InetAddress.getAllByName(host)) {
            byte[] bytes = addr.getAddress();

            if (bytes.length == 4) {
                ipv4 = addr;
            } else if (bytes.length == 16) {
                ipv6 = addr;
            }
        }

        if (ipv4 != null && ipv6 != null) {
            return figureOutNAT64AddrInfo(ipv4.getAddress(), ipv6.getAddress());
        }

        return null;
    }

    /**
     * Based on IPv4 and IPv6 addresses of the same host, the method will make
     * an attempt to figure out what are the NAT64 prefix and suffix.
     *
     * @param ipv4AddrBytes the IPv4 address of the same host in NAT64 network,
     * as returned by {@link InetAddress#getAddress()}.
     * @param ipv6AddrBytes the IPv6 address of the same host in NAT64 network,
     * as returned by {@link InetAddress#getAddress()}.
     * @return {@link NAT64AddrInfo} instance which contains the prefix/suffix
     * of the current NAT64 network or {@code null} if the prefix could not be
     * found.
     */
    static NAT64AddrInfo figureOutNAT64AddrInfo(
            byte[] ipv4AddrBytes,
            byte[] ipv6AddrBytes) {
        String ipv6Str = bytesToHexString(ipv6AddrBytes);
        String ipv4Str = bytesToHexString(ipv4AddrBytes);

        // NAT64 address format:
        // +--+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
        // |PL| 0-------------32--40--48--56--64--72--80--88--96--104---------|
        // +--+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
        // |32|     prefix    |v4(32)         | u | suffix                    |
        // +--+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
        // |40|     prefix        |v4(24)     | u |(8)| suffix                |
        // +--+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
        // |48|     prefix            |v4(16) | u | (16)  | suffix            |
        // +--+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
        // |56|     prefix                |(8)| u |  v4(24)   | suffix        |
        // +--+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
        // |64|     prefix                    | u |   v4(32)      | suffix    |
        // +--+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
        // |96|     prefix                                    |    v4(32)     |
        // +--+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
        int prefixLength = 96;
        int suffixLength = 0;
        String prefix = null;
        String suffix = null;

        if (ipv4Str.equalsIgnoreCase(ipv6Str.substring(prefixLength / 4))) {
            prefix = ipv6Str.substring(0, prefixLength / 4);
        } else {
            // Cut out the 'u' octet
            ipv6Str = ipv6Str.substring(0, 16) + ipv6Str.substring(18);

            for (prefixLength = 64, suffixLength = 6; prefixLength >= 32; ) {
                if (ipv4Str.equalsIgnoreCase(
                        ipv6Str.substring(
                                prefixLength / 4, prefixLength / 4 + 8))) {
                    prefix = ipv6Str.substring(0, prefixLength / 4);
                    suffix = ipv6Str.substring(ipv6Str.length() - suffixLength);
                    break;
                }

                prefixLength -= 8;
                suffixLength += 2;
            }
        }

        return prefix != null ? new NAT64AddrInfo(prefix, suffix) : null;
    }

    /**
     * An overload for {@link #hexStringToIPv6String(StringBuilder)}.
     *
     * @param hexStr a hex representation of IPv6 address bytes.
     * @return an IPv6 address string.
     */
    static String hexStringToIPv6String(String hexStr) {
        return hexStringToIPv6String(new StringBuilder(hexStr));
    }

    /**
     * Converts from HEX representation of IPv6 address bytes into IPv6 address
     * string which includes the ':' signs.
     *
     * @param str a hex representation of IPv6 address bytes.
     * @return eg. FE80:CD00:0000:0CDA:1357:0000:212F:749C
     */
    static String hexStringToIPv6String(StringBuilder str) {
        for (int i = 32 - 4; i > 0; i -= 4) {
            str.insert(i, ":");
        }

        return str.toString().toUpperCase();
    }

    /**
     * Parses an IPv4 address string and returns it's byte array representation.
     *
     * @param ipv4Address eg. '192.168.3.23'
     * @return byte representation of given IPv4 address string.
     * @throws IllegalArgumentException if the address is not in valid format.
     */
    static byte[] ipv4AddressStringToBytes(String ipv4Address) {
        InetAddress address;

        try {
            address = InetAddress.getByName(ipv4Address);
        } catch (UnknownHostException e) {
            throw new IllegalArgumentException(
                    "Invalid IP address: " + ipv4Address, e);
        }

        byte[] bytes = address.getAddress();

        if (bytes.length != 4) {
            throw new IllegalArgumentException(
                    "Not an IPv4 address: " + ipv4Address);
        }

        return bytes;
    }

    /**
     * The NAT64 prefix added to construct IPv6 from an IPv4 address.
     */
    private final String prefix;

    /**
     * The NAT64 suffix (if any) used to construct IPv6 from an IPv4 address.
     */
    private final String suffix;

    /**
     * Creates new instance of {@link NAT64AddrInfo}.
     *
     * @param prefix the NAT64 prefix.
     * @param suffix the NAT64 suffix.
     */
    private NAT64AddrInfo(String prefix, String suffix) {
        this.prefix = prefix;
        this.suffix = suffix;
    }

    /**
     * Based on the NAT64 prefix and suffix will create an IPv6 representation
     * of the given IPv4 address.
     *
     * @param ipv4Address eg. '192.34.2.3'
     * @return IPv6 address string eg. FE80:CD00:0000:0CDA:1357:0000:212F:749C
     * @throws IllegalArgumentException if given string is not a valid IPv4
     * address.
     */
    public String getIPv6Address(String ipv4Address) {
        byte[] ipv4AddressBytes = ipv4AddressStringToBytes(ipv4Address);
        StringBuilder newIPv6Str = new StringBuilder();

        newIPv6Str.append(prefix);
        newIPv6Str.append(bytesToHexString(ipv4AddressBytes));

        if (suffix != null) {
            // Insert the 'u' octet.
            newIPv6Str.insert(16, "00");
            newIPv6Str.append(suffix);
        }

        return hexStringToIPv6String(newIPv6Str);
    }
}
