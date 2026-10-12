// Olm's guarded Node imports are unreachable in the native runtime.
// Throw if that assumption changes instead of providing a fake crypto backend.
throw new Error('Olm unexpectedly entered its Node-only runtime branch');
