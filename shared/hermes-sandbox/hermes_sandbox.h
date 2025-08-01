#ifndef HERMES_SANDBOX_H
#define HERMES_SANDBOX_H

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Create a new isolated Hermes runtime.
 * @return Runtime ID for future operations, or 0 on failure
 */
int64_t hermes_sandbox_create_runtime(void);

/**
 * Evaluate JavaScript code in the specified runtime.
 * @param runtimeId The runtime ID returned by createRuntime()
 * @param code JavaScript code to evaluate
 * @return Result of the evaluation as a string (must be freed by caller)
 */
const char* hermes_sandbox_evaluate_javascript(int64_t runtimeId, const char* code);

/**
 * Delete a runtime and free its resources.
 * @param runtimeId The runtime ID to delete
 */
void hermes_sandbox_delete_runtime(int64_t runtimeId);

/**
 * Check if a runtime exists.
 * @param runtimeId The runtime ID to check
 * @return 1 if the runtime exists, 0 otherwise
 */
int hermes_sandbox_has_runtime(int64_t runtimeId);

#ifdef __cplusplus
}
#endif

#endif // HERMES_SANDBOX_H 