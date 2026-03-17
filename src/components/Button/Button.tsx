export function Button({ variant = 'primary', size = 'md', children }) {
  return (
    <button className={`btn btn-${variant} btn-${size}`}>
      {children}
    </button>
  );
}
```
5. Click **"Add Component"**

**Expected:** Button component added, shows on Components page

### Step 2: Generate Variants
1. Click **"Generate Variants"** on Button card
2. Select sizes: sm, md, lg (from Scale)
3. Enter variants: `primary, secondary, danger`
4. Click **"Generate 9 Variants"**

**Expected:** All 9 files commit to GitHub, you see commit URL

### Step 3: Check GitHub
Go to your repo and verify files exist:
```
src/components/Button/Button.primary.sm.tsx
src/components/Button/Button.primary.md.tsx
src/components/Button/Button.primary.lg.tsx
src/components/Button/Button.secondary.sm.tsx
... (9 total)