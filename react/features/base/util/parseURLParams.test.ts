import { parseURLParams } from './parseURLParams';

describe('parseURLParams', () => {
    it('returns an empty object if no url is provided', () => {
        // @ts-ignore
        expect(parseURLParams(undefined)).toEqual({});
    });

    it('parses hash parameters by default', () => {
        const url = new URL('https://example.com/#key1=value1&key2=value2');
        const params = parseURLParams(url, true);
        expect(params).toEqual({
            key1: 'value1',
            key2: 'value2'
        });
    });

    it('parses search parameters when source is "search"', () => {
        const url = new URL('https://example.com/?foo=bar&baz=qux');
        const params = parseURLParams(url, true, 'search');
        expect(params).toEqual({
            foo: 'bar',
            baz: 'qux'
        });
    });

    it('decodes URI components and parses JSON if dontParse is false', () => {
        const jsonStr = encodeURIComponent(JSON.stringify({ a: 1, b: "test" }));
        const url = `https://example.com/#data=${jsonStr}`;
        const params = parseURLParams(url, false);
        expect(params.data).toEqual({ a: 1, b: "test" });
    });

    it('ignores blacklisted prototype keys to prevent prototype pollution', () => {
        const url = 'https://example.com/#__proto__.admin=true&constructor.prototype=1';
        const params = parseURLParams(url, true);
        expect(params).toEqual({});
    });

    it('handles hash router paths correctly', () => {
        const url = 'https://example.com/#/roomName';
        const params = parseURLParams(url, true);
        expect(params).toEqual({});
    });
});
