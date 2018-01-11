capabilities.json stores the capabilities of Jitsi Meet per browser per version of the browser. The JSON structure is the following:
```
{
    <browser_name>: Array<CapabilitiesByVersion>
}
```

If there is no entry for a browser, this browser is considered unsupported. The browser name should be compatible with the names returned by the bowser package.

The `CapabilitiesByVersion` objects have the following structure:
```
{
    version: <browser_version>,
    capabilities: {
        ...
    },
    iframeCapabilities: {
        ...
    }
}
```
`CapabilitiesByVersion` objects are storing the capabilities for a range of versions. The range of versions for a `CapabilitiesByVersion` object is from the version filled in the previous `CapabilitiesByVersion` object to the version filled in the current object.  For example:
```
"Chrome": [
    {
        "version": "1.0.0.0",
        capabilities: A
    },
    {
        "version": "3.0.0.0",
        capabilities: B
    },
    {
        capabilities: C
    }
]
```

For versions of Chrome lower or equal to 1.0.0.0 will have capabilities A, versions between 1.0.0.0 and 3.0.0.0 will have capabilities B and versions greater than 3.0.0.0 will have capabilities C. The last element in the array doesn't have a version property because it stores information for any version that is greater than 3.0.0.0.

The capabilities property of `CapabilitiesByVersion` object stores the capabilities for the use case where Jitsi Meet is not loaded in an iframe. For the use case when Jitsi Meet is loaded in an iframe the capabilities are calculated by `Object.assign(capabilities, iframeCapabilities)`.


If the calculated capabilities are `undefined` this version is considered  unsupported.
