/**
 * The conference-metadata key under which the shared "editor is open" state is
 * broadcast to every participant (mirrors how the whiteboard shares its state).
 */
export const CODE_EDITOR_METADATA_ID = 'codeEditor';

/**
 * Languages offered in the editor. `id` must match the nextround-api allowlist
 * (and Piston); `cm` selects the CodeMirror language support.
 */
export const CODE_EDITOR_LANGUAGES: Array<{ cm: string; id: string; label: string; }> = [
    { id: 'python', label: 'Python', cm: 'python' },
    { id: 'javascript', label: 'JavaScript', cm: 'javascript' },
    { id: 'typescript', label: 'TypeScript', cm: 'javascript' },
    { id: 'cpp', label: 'C++', cm: 'cpp' },
    { id: 'java', label: 'Java', cm: 'java' },
    { id: 'go', label: 'Go', cm: 'go' },
    { id: 'rust', label: 'Rust', cm: 'rust' }
];

/**
 * Default language selected when the editor first opens.
 */
export const DEFAULT_LANGUAGE = 'python';

/**
 * Starter snippet per language, so an opened editor isn't blank.
 */
export const STARTER_SNIPPETS: Record<string, string> = {
    python: 'print("Hello, NextRound")\n',
    javascript: 'console.log("Hello, NextRound");\n',
    typescript: 'const msg: string = "Hello, NextRound";\nconsole.log(msg);\n',
    cpp: '#include <iostream>\nint main() { std::cout << "Hello, NextRound\\n"; }\n',
    java: 'public class Main {\n    public static void main(String[] a) {\n        System.out.println("Hello, NextRound");\n    }\n}\n',
    go: 'package main\nimport "fmt"\nfunc main() { fmt.Println("Hello, NextRound") }\n',
    rust: 'fn main() { println!("Hello, NextRound"); }\n'
};
