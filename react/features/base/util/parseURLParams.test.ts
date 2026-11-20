import { describe, expect, it } from 'vitest';

import { parseURLParams } from './parseURLParams';

describe('parseURLParams', () => {
    it('parses the JSON values of the hash parameters', () => {
        expect(parseURLParams('https://meet.example.com/room#config.startWithAudioMuted=true&config.subject="Hi"'))
            .toEqual({
                'config.startWithAudioMuted': true,
                'config.subject': 'Hi'
            });
    });

    it('keeps the = signs inside a value', () => {
        expect(parseURLParams('https://meet.example.com/room#config.subject="a=b=c"'))
            .toEqual({ 'config.subject': 'a=b=c' });
    });

    it('keeps the = signs inside a value that is not parsed', () => {
        expect(parseURLParams('https://meet.example.com/room?token=abc==', true, 'search'))
            .toEqual({ token: 'abc==' });
    });

    it('unescapes every escaped & of a value', () => {
        expect(parseURLParams('https://meet.example.com/room#config.subject="a%5C%26b%5C%26c"'))
            .toEqual({ 'config.subject': 'a&b&c' });
    });

    it('gives no value to a parameter without =', () => {
        expect(parseURLParams('https://meet.example.com/room#config.disableDeepLinking&config.subject="Hi"'))
            .toEqual({
                'config.disableDeepLinking': undefined,
                'config.subject': 'Hi'
            });
    });

    it('ignores the blacklisted keys', () => {
        expect(parseURLParams('https://meet.example.com/room#__proto__.polluted=true')).toEqual({});
    });
});
