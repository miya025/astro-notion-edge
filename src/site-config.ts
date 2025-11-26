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
} as const;
