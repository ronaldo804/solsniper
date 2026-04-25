# Master Reverse Engineering Skill (v1.0)
## Objective: Deconstruct, Analyze, and Master external systems and logic.

### 1. Web Intelligence Protocol
- **API Extraction:** Always look for hidden `/api/v1/` or private graphql endpoints in the Network tab.
- **Payload Analysis:** Reverse-engineer the request payload structure to mimic successful transactions.
- **Third-Party Logic:** Analyze how competitors handle user sessions and data persistence.

### 2. JavaScript De-obfuscation
- **Variable Reconstruction:** Rename minified variables (a, b, c) to meaningful names based on context.
- **Logic Mapping:** Trace function calls to identify core algorithms (e.g., scoring logic, reward calculations).
- **Security Bypassing:** Identify client-side checks that can be optimized or adjusted.

### 3. Asset Recovery
- **Sprite Extraction:** Automatically identify and categorize image assets from CSS/JS bundles.
- **Audio Extraction:** Locate and extract high-quality audio triggers.
- **Pattern Matching:** Match visual styles to existing design systems for consistency.

### 4. Continuous Scanning
- **Secret Detection:** Scan for API keys, development endpoints, or hardcoded credentials.
- **Vulnerability Identification:** Look for common logic flaws like insecure direct object references (IDOR) in client-side code.
