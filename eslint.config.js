import globals from "globals";

export default [
    {
        files: ["**/*.js"], // Apply to all JavaScript files
        languageOptions: {
            ecmaVersion: "latest", // Use the latest ECMAScript version
            sourceType: "module", // Enable ES module syntax
            globals: {
                ...globals.browser, // Include browser globals like `window`
                ...globals.node // Include Node.js globals like `require`
            }
        },
        rules: {
            // Disallow the use of `console`
            "no-restricted-globals": [
                "error",
                {
                    name: "console",
                    message: "Use the custom logging module instead of console."
                }
            ],

            // Example of other common rules
            "no-unused-vars": "warn", // Warn about unused variables
            "eqeqeq": "error", // Enforce strict equality (`===` and `!==`)
            //"curly": "error", // Require curly braces for all control statements
            "semi": ["error", "always"], // Require semicolons
            "quotes": ["error", "double"] // Enforce double quotes for strings
        }
    }
];