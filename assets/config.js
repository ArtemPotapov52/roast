/* ROAST — Tailwind CDN config (loaded after the CDN script) */
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink:    '#0a0a0a',   // off-black background
        coal:   '#121212',   // raised surface
        line:   '#262626',   // hairline / borders
        brand:  '#FFE000',   // electric yellow accent (single accent, locked)
        'brand-dim': '#C7B000',
        paper:  '#FAFAF7',   // off-white text
        muted:  '#9a9a90',   // secondary text
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { none: '0px' },
    },
  },
};
