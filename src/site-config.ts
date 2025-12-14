export const SITE_CONFIG = {
  title: 'My Notion Blog',
  description: 'A fast, secure blog powered by Notion and Astro',
  author: 'Your Name',
  url: 'https://example.com', // astro.config.mjsと合わせる
  lang: 'ja',
  ogImage: '/og-image.png',

  // Navigation
  nav: [
    { name: 'Home', href: '/' },
  ],

  // Social Links
  social: {
    twitter: 'https://twitter.com/yourusername',
    github: 'https://github.com/yourusername',
  },

  // Cloudflare Image Resizing (Pro版機能)
  // Cloudflare Pro以上のプランを使用している場合はtrueに設定
  // Freeプランの場合はfalseのままにしてください
  useCloudflareImageResizing: false,
} as const;
