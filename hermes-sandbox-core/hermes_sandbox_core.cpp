#include <string>
#include <memory>
#include <map>
#include <vector>
#include "jsi.h"

using namespace facebook::jsi;

// Simple isolated context for JavaScript evaluation
class IsolatedContext {
private:
    std::string name_;
    std::map<std::string, std::string> variables_;
    
public:
    IsolatedContext(const std::string& name) : name_(name) {}
    
    std::string getName() const { return name_; }
    
    // Simple JavaScript-like evaluation
    std::string evaluate(const std::string& code, const std::string& sourceURL) {
        // This is a simplified JavaScript evaluator
        // In a real implementation, this would use a proper JavaScript engine
        
        // Handle basic expressions
        if (code.find("let ") == 0 || code.find("var ") == 0 || code.find("const ") == 0) {
            // Variable declaration
            size_t spacePos = code.find(' ');
            size_t equalsPos = code.find('=');
            if (equalsPos != std::string::npos) {
                std::string varName = code.substr(spacePos + 1, equalsPos - spacePos - 1);
                std::string value = code.substr(equalsPos + 1);
                // Remove semicolon if present
                if (!value.empty() && value.back() == ';') {
                    value.pop_back();
                }
                // Remove quotes if present
                if (value.length() >= 2 && value.front() == '"' && value.back() == '"') {
                    value = value.substr(1, value.length() - 2);
                }
                variables_[varName] = value;
                return "undefined";
            }
        } else if (code.find("console.log") == 0) {
            // Console.log simulation
            size_t start = code.find('(');
            size_t end = code.rfind(')');
            if (start != std::string::npos && end != std::string::npos) {
                std::string arg = code.substr(start + 1, end - start - 1);
                // Remove quotes if present
                if (arg.length() >= 2 && arg.front() == '"' && arg.back() == '"') {
                    arg = arg.substr(1, arg.length() - 2);
                }
                return arg;
            }
        } else {
            // Try to evaluate as a simple expression
            std::string trimmed = code;
            if (!trimmed.empty() && trimmed.back() == ';') {
                trimmed.pop_back();
            }
            
            // Handle basic arithmetic
            if (trimmed.find(" + ") != std::string::npos) {
                size_t pos = trimmed.find(" + ");
                std::string left = trimmed.substr(0, pos);
                std::string right = trimmed.substr(pos + 3);
                
                // Try to convert to numbers
                try {
                    double leftNum = std::stod(left);
                    double rightNum = std::stod(right);
                    return std::to_string(leftNum + rightNum);
                } catch (...) {
                    // If not numbers, concatenate as strings
                    return left + right;
                }
            } else if (trimmed.find(" * ") != std::string::npos) {
                size_t pos = trimmed.find(" * ");
                std::string left = trimmed.substr(0, pos);
                std::string right = trimmed.substr(pos + 3);
                
                try {
                    double leftNum = std::stod(left);
                    double rightNum = std::stod(right);
                    return std::to_string(leftNum * rightNum);
                } catch (...) {
                    return "NaN";
                }
            } else if (trimmed.find(" - ") != std::string::npos) {
                size_t pos = trimmed.find(" - ");
                std::string left = trimmed.substr(0, pos);
                std::string right = trimmed.substr(pos + 3);
                
                try {
                    double leftNum = std::stod(left);
                    double rightNum = std::stod(right);
                    return std::to_string(leftNum - rightNum);
                } catch (...) {
                    return "NaN";
                }
            } else if (trimmed.find(" / ") != std::string::npos) {
                size_t pos = trimmed.find(" / ");
                std::string left = trimmed.substr(0, pos);
                std::string right = trimmed.substr(pos + 3);
                
                try {
                    double leftNum = std::stod(left);
                    double rightNum = std::stod(right);
                    if (rightNum == 0) return "Infinity";
                    return std::to_string(leftNum / rightNum);
                } catch (...) {
                    return "NaN";
                }
            } else {
                // Check if it's a variable reference
                auto it = variables_.find(trimmed);
                if (it != variables_.end()) {
                    return it->second;
                }
                
                // Try to parse as a number
                try {
                    double num = std::stod(trimmed);
                    return std::to_string(num);
                } catch (...) {
                    // If it's a string literal
                    if (trimmed.length() >= 2 && trimmed.front() == '"' && trimmed.back() == '"') {
                        return trimmed.substr(1, trimmed.length() - 2);
                    }
                    
                    return "undefined";
                }
            }
        }
        
        return "undefined";
    }
};

class HermesSandbox {
private:
    std::map<int64_t, std::unique_ptr<IsolatedContext>> contexts_;
    std::map<int64_t, std::string> contextNames_;
    int64_t nextContextId_ = 1;
    std::vector<std::string> resultBuffer_;

public:
    int64_t createRuntime(const std::string& name = "") {
        int64_t contextId = nextContextId_++;
        
        try {
            auto context = std::make_unique<IsolatedContext>(name.empty() ? "context_" + std::to_string(contextId) : name);
            contexts_[contextId] = std::move(context);
            contextNames_[contextId] = name.empty() ? "context_" + std::to_string(contextId) : name;
            
            return contextId;
        } catch (const std::exception& e) {
            nextContextId_--;
            throw;
        }
    }

    std::string evaluateJavaScript(int64_t contextId, const std::string& code, const std::string& sourceURL = "hermes_sandbox") {
        auto it = contexts_.find(contextId);
        if (it == contexts_.end()) {
            throw std::runtime_error("Invalid context ID: " + std::to_string(contextId));
        }

        try {
            return it->second->evaluate(code, sourceURL);
        } catch (const std::exception& e) {
            return "Error: " + std::string(e.what());
        }
    }

    bool deleteRuntime(int64_t contextId) {
        auto it = contexts_.find(contextId);
        if (it != contexts_.end()) {
            contexts_.erase(it);
            contextNames_.erase(contextId);
            return true;
        }
        return false;
    }

    bool hasRuntime(int64_t contextId) {
        return contexts_.find(contextId) != contexts_.end();
    }

    std::string getRuntimeName(int64_t contextId) {
        auto it = contextNames_.find(contextId);
        return it != contextNames_.end() ? it->second : "";
    }

    std::vector<int64_t> getAllRuntimeIds() {
        std::vector<int64_t> ids;
        for (const auto& pair : contexts_) {
            ids.push_back(pair.first);
        }
        return ids;
    }

    int getRuntimeCount() {
        return static_cast<int>(contexts_.size());
    }

    // Store result in buffer to avoid static string issues
    const char* storeResult(const std::string& result) {
        resultBuffer_.push_back(result);
        return resultBuffer_.back().c_str();
    }

    // Clear old results to prevent memory leaks
    void clearOldResults() {
        if (resultBuffer_.size() > 100) {
            resultBuffer_.erase(resultBuffer_.begin(), resultBuffer_.begin() + 50);
        }
    }
};

static HermesSandbox g_hermesSandbox;

extern "C" {
    int64_t hermes_sandbox_create_runtime(const char* name) {
        try {
            std::string runtimeName = name ? std::string(name) : "";
            return g_hermesSandbox.createRuntime(runtimeName);
        } catch (const std::exception& e) {
            return 0;
        }
    }

    const char* hermes_sandbox_evaluate_javascript(int64_t runtimeId, const char* code, const char* sourceURL) {
        try {
            std::string codeStr = code ? std::string(code) : "";
            std::string sourceURLStr = sourceURL ? std::string(sourceURL) : "hermes_sandbox";
            
            std::string result = g_hermesSandbox.evaluateJavaScript(runtimeId, codeStr, sourceURLStr);
            g_hermesSandbox.clearOldResults();
            return g_hermesSandbox.storeResult(result);
        } catch (const std::exception& e) {
            g_hermesSandbox.clearOldResults();
            return g_hermesSandbox.storeResult("Error: " + std::string(e.what()));
        }
    }

    bool hermes_sandbox_delete_runtime(int64_t runtimeId) {
        try {
            return g_hermesSandbox.deleteRuntime(runtimeId);
        } catch (const std::exception& e) {
            return false;
        }
    }

    bool hermes_sandbox_has_runtime(int64_t runtimeId) {
        try {
            return g_hermesSandbox.hasRuntime(runtimeId);
        } catch (const std::exception& e) {
            return false;
        }
    }

    const char* hermes_sandbox_get_runtime_name(int64_t runtimeId) {
        try {
            std::string name = g_hermesSandbox.getRuntimeName(runtimeId);
            g_hermesSandbox.clearOldResults();
            return g_hermesSandbox.storeResult(name);
        } catch (const std::exception& e) {
            return nullptr;
        }
    }

    int hermes_sandbox_get_runtime_count() {
        try {
            return g_hermesSandbox.getRuntimeCount();
        } catch (const std::exception& e) {
            return 0;
        }
    }
} 