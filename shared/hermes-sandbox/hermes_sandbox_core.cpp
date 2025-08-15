#include <string>
#include <memory>
#include <map>
#include <hermes/hermes.h>
#include <jsi/jsi.h>

using namespace facebook::jsi;
using namespace facebook::hermes;

class HermesSandbox {
private:
    std::map<int64_t, std::unique_ptr<Runtime>> runtimes_;
    int64_t nextRuntimeId_ = 1;

public:
    int64_t createRuntime() {
        int64_t runtimeId = nextRuntimeId_++;
        
        runtimes_[runtimeId] = makeHermesRuntime();
        
        return runtimeId;
    }

    std::string evaluateJavaScript(int64_t runtimeId, const std::string& code) {
        auto it = runtimes_.find(runtimeId);
        if (it == runtimes_.end()) {
            throw std::runtime_error("Invalid runtime ID");
        }

        try {
            auto result = it->second->evaluateJavaScript(
                std::make_shared<StringBuffer>(code),
                "hermes_sandbox"
            );

            if (result.isString()) {
                return result.asString(*it->second).utf8(*it->second);
            } else if (result.isNumber()) {
                return std::to_string(result.asNumber());
            } else if (result.isBool()) {
                return result.asBool() ? "true" : "false";
            } else if (result.isUndefined()) {
                return "undefined";
            } else if (result.isNull()) {
                return "null";
            } else {
                return "[object Object]";
            }
        } catch (const JSError& error) {
            return "Error: " + error.getMessage();
        }
    }

    void deleteRuntime(int64_t runtimeId) {
        auto it = runtimes_.find(runtimeId);
        if (it != runtimes_.end()) {
            runtimes_.erase(it);
        }
    }

    bool hasRuntime(int64_t runtimeId) {
        return runtimes_.find(runtimeId) != runtimes_.end();
    }
};

static HermesSandbox g_hermesSandbox;

extern "C" {
    int64_t hermes_sandbox_create_runtime() {
        return g_hermesSandbox.createRuntime();
    }

    const char* hermes_sandbox_evaluate_javascript(int64_t runtimeId, const char* code) {
        try {
            std::string result = g_hermesSandbox.evaluateJavaScript(runtimeId, code);
            static std::string lastResult;
            lastResult = result;
            return lastResult.c_str();
        } catch (const std::exception& e) {
            static std::string errorResult = "Error: " + std::string(e.what());
            return errorResult.c_str();
        }
    }

    void hermes_sandbox_delete_runtime(int64_t runtimeId) {
        g_hermesSandbox.deleteRuntime(runtimeId);
    }

    bool hermes_sandbox_has_runtime(int64_t runtimeId) {
        return g_hermesSandbox.hasRuntime(runtimeId);
    }
} 