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
package org.jitsi.meet.sdk.net;

import org.junit.Test;

import java.math.BigInteger;
import java.net.UnknownHostException;

import static org.junit.Assert.*;

/**
 * Tests for {@link NAT64AddrInfo} class.
 */
public class NAT64AddrInfoTest {
    /**
     * Test case for the 96 prefix length.
     */
    @Test
    public void test96Prefix() {
        testPrefixSuffix(
                "260777000000000400000000", "", "203.0.113.1", "23.17.23.3");
    }

    /**
     * Test case for the 64 prefix length.
     */
    @Test
    public void test64Prefix() {
        String prefix = "1FF2A227B3AAF3D2";
        String suffix = "BB87C8";

        testPrefixSuffix(prefix, suffix, "48.46.87.34", "23.87.145.4");
    }

    /**
     * Test case for the 56 prefix length.
     */
    @Test
    public void test56Prefix() {
        String prefix = "1FF2A227B3AAF3";
        String suffix = "A2BB87C8";

        testPrefixSuffix(prefix, suffix, "34.72.234.255", "1.235.3.65");
    }

    /**
     * Test case for the 48 prefix length.
     */
    @Test
    public void test48Prefix() {
        String prefix = "1FF2A227B3AA";
        String suffix = "72A2BB87C8";

        testPrefixSuffix(prefix, suffix, "97.54.3.23", "77.49.0.33");
    }

    /**
     * Test case for the 40 prefix length.
     */
    @Test
    public void test40Prefix() {
        String prefix = "1FF2A227B3";
        String suffix = "D972A2BB87C8";

        testPrefixSuffix(prefix, suffix, "10.23.56.121", "97.65.32.21");
    }

    /**
     * Test case for the 32 prefix length.
     */
    @Test
    public void test32Prefix()
        throws UnknownHostException {
        String prefix = "1FF2A227";
        String suffix = "20D972A2BB87C8";

        testPrefixSuffix(prefix, suffix, "162.63.65.189", "135.222.84.206");
    }

    private static String buildIPv6Addr(
            String prefix, String suffix, String ipv4Hex) {
        String ipv6Str = prefix + ipv4Hex + suffix;

        if (suffix.length() > 0) {
            ipv6Str = new StringBuilder(ipv6Str).insert(16, "00").toString();
        }

        return ipv6Str;
    }

    private void testPrefixSuffix(
            String prefix, String suffix, String ipv4, String otherIPv4) {
        byte[] ipv4Bytes = NAT64AddrInfo.ipv4AddressStringToBytes(ipv4);
        String ipv4String = NAT64AddrInfo.bytesToHexString(ipv4Bytes);
        String ipv6Str = buildIPv6Addr(prefix, suffix, ipv4String);

        BigInteger ipv6Address = new BigInteger(ipv6Str, 16);

        NAT64AddrInfo nat64AddrInfo
            = NAT64AddrInfo.figureOutNAT64AddrInfo(
                    ipv4Bytes, ipv6Address.toByteArray());

        assertNotNull("Failed to figure out NAT64 info", nat64AddrInfo);

        String newIPv6 = nat64AddrInfo.getIPv6Address(ipv4);

        assertEquals(
                NAT64AddrInfo.hexStringToIPv6String(ipv6Address.toString(16)),
                newIPv6);

        byte[] ipv4Addr2 = NAT64AddrInfo.ipv4AddressStringToBytes(otherIPv4);
        String ipv4Addr2Hex = NAT64AddrInfo.bytesToHexString(ipv4Addr2);

        newIPv6 = nat64AddrInfo.getIPv6Address(otherIPv4);

        assertEquals(
                NAT64AddrInfo.hexStringToIPv6String(
                        buildIPv6Addr(prefix, suffix, ipv4Addr2Hex)),
                newIPv6);
    }

    @Test
    public void testInvalidIPv4Format() {
        testInvalidIPv4Format("256.1.2.3");
        testInvalidIPv4Format("FE80:CD00:0000:0CDA:1357:0000:212F:749C");
    }

    private void testInvalidIPv4Format(String ipv4Str) {
        try {
            NAT64AddrInfo.ipv4AddressStringToBytes(ipv4Str);
            fail("Did not throw IllegalArgumentException");
        } catch (IllegalArgumentException exc) {
            /* OK */
        }
    }
}
