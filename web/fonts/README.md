# Universal Sans (self-hosted)

[Universal Sans](https://familytype.co/universal-sans) is a commercial typeface from Family Type. **Do not commit font files here unless your license allows it.**

Place your licensed `.woff2` files in this directory using these exact names:

| File | CSS weight |
|------|------------|
| `UniversalSans-Light.woff2` | 300 |
| `UniversalSans-Regular.woff2` | 400 |
| `UniversalSans-Medium.woff2` | 500 |
| `UniversalSans-SemiBold.woff2` | 600 |
| `UniversalSans-Bold.woff2` | 700 |
| `UniversalSans-ExtraBold.woff2` | 800 |

If your export uses different filenames, rename to match or edit the `@font-face` rules at the top of `web/styles.css`.

Until files are present, the dashboard uses the system UI stack defined in `--font` / `--font-display`.
