## Description
## Fishmeet Customization Checklist
*These checks ensure we maintain the "Overlay" architecture and minimize upstream update costs.*

### 🏗 Architecture & Overrides
- [ ] **No direct core edits:** Does this PR avoid manual modifications to `react/` or `css/` files?
- [ ] **Placement:** Are all fishmeet-specific customizations located under the `fishmeet/` directory?
- [ ] **Directory Mirroring:** Do files in `fishmeet/react/` mirror the exact path of the core files they intend to replace?

### 🛠 Core Extension Points (If core files WERE modified)
- [ ] **Minimalism:** Is the core change small enough that a full override wasn't justified?
- [ ] **Access Pattern:** Does it use the `(styles as any).propName` pattern to read optional properties?
- [ ] **No Branding Logic:** Did you avoid adding `if (appType.isFishMeet)` inside core files?

### 🎨 Styles & Assets
- [ ] **Design Tokens:** Are all colors referencing `BaseTheme.palette.fishMeet*` (no hex values)?
- [ ] **Annotations:** Are all overridden style properties annotated with `// fishmeet: was <original value>`?
- [ ] **Icons:** Are new branded icons placed in `fishmeet/react/features/base/icons/svg/`?

### ⚠️ Maintenance Liability
- [ ] **TSX Overrides:** If a full `.tsx` file was overridden, is it absolutely necessary, or can a stylesheet suffice?
- [ ] **Config:** Are feature flags added to `config.js` and `configType.ts` for server-side control?

