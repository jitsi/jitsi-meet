#ifndef HERMES_SANDBOX_H
#define HERMES_SANDBOX_H

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Create a new isolated Hermes runtime.
 * @param name Optional name for the runtime (can be NULL)
 * @return Runtime ID for future operations, or 0 on failure
 */
int64_t hermes_sandbox_create_runtime(const char* name);

/**
 * Evaluate JavaScript code in the specified runtime.
 * @param runtimeId The runtime ID returned by createRuntime()
 * @param code JavaScript code to evaluate
 * @param sourceURL Optional source URL for debugging (can be NULL)
 * @return Result of the evaluation as a string (managed by the core, don't free)
 */
const char* hermes_sandbox_evaluate_javascript(int64_t runtimeId, const char* code, const char* sourceURL);

/**
 * Delete a runtime and free its resources.
 * @param runtimeId The runtime ID to delete
 * @return true if runtime was deleted, false if it didn't exist
 */
bool hermes_sandbox_delete_runtime(int64_t runtimeId);

/**
 * Check if a runtime exists.
 * @param runtimeId The runtime ID to check
 * @return true if the runtime exists, false otherwise
 */
bool hermes_sandbox_has_runtime(int64_t runtimeId);

/**
 * Get the name of a runtime.
 * @param runtimeId The runtime ID
 * @return Runtime name as string (managed by the core, don't free), or NULL if not found
 */
const char* hermes_sandbox_get_runtime_name(int64_t runtimeId);

/**
 * Get the total number of active runtimes.
 * @return Number of active runtimes
 */
int hermes_sandbox_get_runtime_count(void);

#ifdef __cplusplus
}
#endif

#endif // HERMES_SANDBOX_H 