#!/usr/bin/env node

/**
 * Deployment script for Sonacove Meets
 *
 * This script handles building and deploying the application to Cloudflare.
 *
 * Usage:
 *   node config/deploy-cf.mjs [--skip-deps] [--skip-build]
 */

import fs from "fs";
import path from "path";
import { spawn, exec } from "child_process";

// Utility function to execute commands and log output in real-time
async function runCommand(command, cwd, captureOutput = false, timeoutMs = 300000) {
    // 5 minute default timeout
    const actualCwd = cwd || process.cwd();
    console.log(`\n🚀 Running: ${command} (in ${actualCwd})`);

    return new Promise((resolve, reject) => {
        const [cmd, ...args] = command.split(" ");
        const child = spawn(cmd, args, {
            cwd: actualCwd,
            shell: true,
            stdio: "pipe",
        });

        let capturedOutput = "";
        let timeoutId = null;

        // Set up timeout
        if (timeoutMs > 0) {
            timeoutId = setTimeout(() => {
                console.error(`⏰ Command timed out after ${timeoutMs / 1000} seconds: ${command}`);
                child.kill("SIGTERM");
                reject(new Error(`Command timed out after ${timeoutMs / 1000} seconds: ${command}`));
            }, timeoutMs);
            console.log(`⏱️  Command timeout set to ${timeoutMs / 1000} seconds`);
        }

        child.stdout.on("data", (data) => {
            const output = data.toString();
            process.stdout.write(data);
            if (captureOutput) {
                capturedOutput += output;
            }
        });

        child.stderr.on("data", (data) => {
            const output = data.toString();
            process.stderr.write(data);
            if (captureOutput) {
                capturedOutput += output;
            }
        });

        child.on("close", (code) => {
            if (timeoutId) clearTimeout(timeoutId);

            if (code === 0) {
                process.stdout.write("\n");
                console.log(`✅ Command finished: ${command}`);
                resolve(capturedOutput || undefined);
            } else {
                process.stdout.write("\n");
                console.error(`❌ Command failed with code ${code}: ${command}`);
                reject(new Error(`Command failed with code ${code}: ${command}`));
            }
        });

        child.on("error", (err) => {
            if (timeoutId) clearTimeout(timeoutId);

            process.stdout.write("\n");
            console.error(`❌ Error executing command: ${command}`);
            console.error(err);
            reject(err);
        });
    });
}

// Check if a command exists in the PATH
async function commandExists(command) {
    try {
        await runCommand(process.platform === "win32" ? `where ${command}` : `which ${command}`);
        return true;
    } catch (error) {
        return false;
    }
}

// Utility function to ensure a directory exists
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`📁 Created directory: ${dirPath}`);
    }
}

// Utility function to copy a file or directory
function copyFileOrDirectory(source, destination, isTopLevelCall = true) {
    if (!fs.existsSync(source)) {
        console.error(`❌ Source does not exist: ${source}`);
        process.exit(1);
    }

    const stats = fs.statSync(source);

    if (stats.isDirectory()) {
        if (isTopLevelCall) {
            console.log(`📋 Copying directory: ${source} -> ${destination}`);
        }
        ensureDirectoryExists(destination);
        const files = fs.readdirSync(source);
        for (const file of files) {
            copyFileOrDirectory(path.join(source, file), path.join(destination, file), false);
        }
    } else {
        ensureDirectoryExists(path.dirname(destination));
        fs.copyFileSync(source, destination);
        if (isTopLevelCall) {
            console.log(`📋 Copied file: ${source} -> ${destination}`);
        }
    }
}

/**
 * Process SSI directives in HTML files
 * @param {string} filePath - The path to the HTML file
 * @param {string} meetRootDir - The root directory for meet (for resolving paths with leading slash)
 * @param {number} depth - Current recursion depth
 * @param {Set<string>} includedFiles - Set of already included files to prevent cycles
 */
function processSSI(filePath, meetRootDir, depth = 0, includedFiles = new Set()) {
    const MAX_DEPTH = 5;

    if (depth >= MAX_DEPTH) {
        console.warn(`⚠️ SSI processing reached max depth of ${MAX_DEPTH} for ${filePath}, stopping recursion`);
        return;
    }

    console.log(`🔄 Processing SSI in: ${filePath}`);

    try {
        let html = fs.readFileSync(filePath, "utf8");
        const ssiPattern = /<!--#include\s+virtual="([^"]+)"\s*-->/g;
        const fileDir = path.dirname(filePath);

        html = html.replace(ssiPattern, (fullMatch, includePath) => {
            let resolvedPath;
            if (includePath.startsWith("/")) {
                resolvedPath = path.join(meetRootDir, includePath.substring(1));
            } else {
                resolvedPath = path.resolve(fileDir, includePath);
            }

            if (includedFiles.has(resolvedPath)) {
                console.warn(`⚠️ SSI circular include detected: ${resolvedPath}`);
                return "<!-- SSI circular include detected -->";
            }

            if (fs.existsSync(resolvedPath)) {
                const content = fs.readFileSync(resolvedPath, "utf8");
                includedFiles.add(resolvedPath);
                return processSSIContent(
                    content,
                    path.dirname(resolvedPath),
                    meetRootDir,
                    depth + 1,
                    new Set([...includedFiles])
                );
            }

            console.warn(`⚠️ SSI include file not found: ${resolvedPath}`);
            return `<!-- SSI include file not found: ${resolvedPath} -->`;
        });
        fs.writeFileSync(filePath, html);
    } catch (err) {
        console.error(`❌ Error processing SSI in ${filePath}:`, err);
    }
}

function processSSIContent(content, baseDir, meetRootDir, depth = 0, includedFiles = new Set()) {
    const MAX_DEPTH = 5;
    if (depth >= MAX_DEPTH) {
        console.warn(`⚠️ SSI content processing reached max depth of ${MAX_DEPTH}, stopping recursion`);
        return content;
    }
    const ssiPattern = /<!--#include\s+virtual="([^"]+)"\s*-->/g;
    return content.replace(ssiPattern, (fullMatch, includePath) => {
        let resolvedPath;
        if (includePath.startsWith("/")) {
            resolvedPath = path.join(meetRootDir, includePath.substring(1));
        } else {
            resolvedPath = path.resolve(baseDir, includePath);
        }

        if (includedFiles.has(resolvedPath)) {
            console.warn(`⚠️ SSI circular include detected: ${resolvedPath}`);
            return "<!-- SSI circular include detected -->";
        }
        if (fs.existsSync(resolvedPath)) {
            const includeContent = fs.readFileSync(resolvedPath, "utf8");
            includedFiles.add(resolvedPath);
            return processSSIContent(
                includeContent,
                path.dirname(resolvedPath),
                meetRootDir,
                depth + 1,
                new Set([...includedFiles])
            );
        }
        console.warn(`⚠️ SSI include file not found: ${resolvedPath}`);
        return `<!-- SSI include file not found: ${resolvedPath} -->`;
    });
}

function processDirectoryForSSI(directory, meetRootDir) {
    if (!fs.existsSync(directory)) {
        console.error(`❌ Directory does not exist: ${directory}`);
        return;
    }
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            processDirectoryForSSI(filePath, meetRootDir);
        } else if (filePath.endsWith(".html")) {
            processSSI(filePath, meetRootDir, 0, new Set());
        }
    }
}

async function deploy() {
    const projectRoot = process.cwd();
    const distDir = path.join(projectRoot, "dist");
    const distMeetDir = path.join(distDir, "meet");

    const args = process.argv.slice(2);
    const skipDeps = args.includes("--skip-deps");
    const skipBuild = args.includes("--skip-build");

    try {
        console.log("🚀 Starting build and preparation process...");

        // Step 1: Make sure we are running from the project root
        if (!fs.existsSync(path.join(projectRoot, "package.json"))) {
            console.error("❌ Error: Script must be run from the project root directory.");
            process.exit(1);
        }
        console.log("✅ Running from project root.");

        // Step 1.5: Verify submodule is properly initialized
        const submodulePath = path.join(projectRoot, "lib-jitsi-meet");
        const submodulePackageJson = path.join(submodulePath, "package.json");
        if (!fs.existsSync(submodulePath) || !fs.existsSync(submodulePackageJson)) {
            console.log("⚠️  Submodule not found, attempting to initialize...");
            try {
                await runCommand("git submodule update --init --recursive");
                console.log("✅ Submodule initialized successfully");
            } catch (error) {
                console.error("❌ Failed to initialize submodule:", error.message);
                console.error("Please ensure you have access to the submodule repository and run:");
                console.error("  git submodule update --init --recursive");
                process.exit(1);
            }
        } else {
            console.log("✅ Submodule verification passed.");
        }

        console.log("\n🧹 Cleaning dist folder...");
        if (fs.existsSync(distDir)) {
            fs.rmSync(distDir, { recursive: true, force: true });
        }
        ensureDirectoryExists(distDir);
        ensureDirectoryExists(distMeetDir);

        // Step 2: Install dependencies
        if (skipDeps) {
            console.log("\n⏭️ Skipping dependency installation (--skip-deps).");
        } else {
            console.log("\n📦 Step 2: Installing dependencies...");
            await runCommand("npm ci");
        }

        // Step 3: Build the project
        if (skipBuild) {
            console.log("\n⏭️ Skipping project build (--skip-build).");
        } else {
            console.log("\n🛠️ Step 3: Building the project...");
            await runCommand("make all", undefined, true, 600000); // 10 minute timeout for full build
        }

        // Step 4: Copy files and folders to the dist folder
        console.log("\n📂 Step 4: Copying files to dist folder...");
        const foldersToCopy = ["fonts", "lang", "images", "libs", "sounds", "static"];
        foldersToCopy.forEach((folder) => {
            const src = path.join(projectRoot, folder);
            const dest = path.join(distMeetDir, folder);
            if (fs.existsSync(src)) {
                copyFileOrDirectory(src, dest);
            } else {
                console.warn(`⚠️ Source directory not found, skipping: ${src}`);
            }
        });

        const rootHtmlFiles = fs.readdirSync(projectRoot).filter((f) => f.endsWith(".html"));
        const filesToCopy = [
            "conference.js",
            "config.js",
            "interface_config.js",
            "manifest.json",
            "pwa-worker.js",
            ...rootHtmlFiles,
        ];

        filesToCopy.forEach((file) => {
            const src = path.join(projectRoot, file);
            const dest = path.join(distMeetDir, file);
            if (fs.existsSync(src)) {
                fs.copyFileSync(src, dest);
                console.log(`  -> Copied ${file}`);
            } else {
                console.warn(`⚠️ Source file not found, skipping: ${src}`);
            }
        });

        const cssFile = "css/all.css";
        const cssSrc = path.join(projectRoot, cssFile);
        const cssDest = path.join(distMeetDir, cssFile);
        if (fs.existsSync(cssSrc)) {
            ensureDirectoryExists(path.dirname(cssDest));
            fs.copyFileSync(cssSrc, cssDest);
            console.log(`  -> Copied ${cssFile}`);
        } else {
            console.error(`❌ Critical file not found after build: ${cssSrc}`);
            console.error("Build cannot continue without the main stylesheet.");
            process.exit(1);
        }

        const a404source = path.join(projectRoot, "static/404.html");
        const a404dest = path.join(distMeetDir, "404.html");
        if (fs.existsSync(a404source)) {
            fs.copyFileSync(a404source, a404dest);
            console.log("  -> Copied static/404.html to dist/meet/404.html");
        } else {
            console.warn(`⚠️ 404 page not found at ${a404source}`);
        }

        const redirectsSrc = path.join(projectRoot, "config/_redirects");
        const redirectsDest = path.join(distDir, "_redirects");
        if (fs.existsSync(redirectsSrc)) {
            fs.copyFileSync(redirectsSrc, redirectsDest);
            console.log("  -> Copied config/_redirects to dist/_redirects");
        } else {
            console.warn("⚠️ Redirects file not found, skipping: config/_redirects");
        }

        console.log("✅ Files copied.");

        // Step 5: Compile the html files with SSI
        console.log("\n🔄 Step 5: Processing SSI in HTML files...");
        processDirectoryForSSI(distMeetDir, distMeetDir);
        console.log("✅ SSI processing complete.");

        console.log("\n🎉 Build and preparation completed successfully!");
        console.log("📁 Built files are ready in the dist directory for deployment.");
    } catch (error) {
        console.error("\n❌ Build failed:", error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

deploy();
