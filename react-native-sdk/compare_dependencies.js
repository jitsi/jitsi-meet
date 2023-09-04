/**
 * Compares two software version numbers.
 *
 * @param {string} v1 The first version.
 * @param {string} v2 The second version.
 * @param {string} dependency Name of the dependency.
 *
 * @returns {number|NaN}
 * - 0 if the versions are equal
 * - a negative integer if v1 < v2
 * - a positive integer if v1 > v2
 * - NaN if either version string is in the wrong format
 */
function versionCompare(v1, v2, dependency) {
    let v1parts = (v1 || '0').split('.'),
        v2parts = (v2 || '0').split('.');

    while (v1parts.length < v2parts.length) {
        v1parts.push('0');
    }

    while (v2parts.length < v1parts.length) {
        v2parts.push('0');
    }

    v1parts = v1parts.map((x) => {
        const match = (/[A-Za-zαß]/).exec(x);

        return Number(match ? x.replace(match[0], `. ${x.charCodeAt(match.index)}`) : x);
    });
    v2parts = v2parts.map((x) => {
        const match = (/[A-Za-zαß]/).exec(x);

        return Number(match ? x.replace(match[0], `. ${x.charCodeAt(match.index)}`) : x);
    });

    for (let i = 0; i < v1parts.length; ++i) {
        if (v2parts.length === i) {
            return 1;
        }

        if (v1parts[i] === v2parts[i]) {
            continue;
        }

        if (v1parts[i] < v2parts[i]) {
            console.log(`⚠️We recommend you update ${dependency}: ${v1parts} to ${v2parts}`);

            return 1;
        }

        return -1;
    }

    if (v1parts.length !== v2parts.length) {
        return -1;
    }

    return 0;
}

module.exports = { versionCompare };
