import type { Config } from 'tailwindcss';

/**
 * Tailwind CSS 配置
 * 从原始 google-stitch-ai-design.html 内联配置迁移而来
 * 使用 Material Design 3 色彩体系
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,js}'],
  darkMode: 'class',
  theme: {
    extend: {
      /* Material Design 3 色彩 token */
      colors: {
        'surface-container-high': '#e7e8e9',
        'surface-container-highest': '#e1e3e4',
        'on-tertiary-container': '#ee855e',
        'on-tertiary-fixed': '#380d00',
        'primary-fixed-dim': '#b1c5ff',
        'on-tertiary-fixed-variant': '#7c2e0d',
        'on-error': '#ffffff',
        'tertiary': '#441100',
        'outline': '#747782',
        'tertiary-fixed': '#ffdbcf',
        'surface-container': '#edeeef',
        'on-tertiary': '#ffffff',
        'primary-fixed': '#dae2ff',
        'surface-container-low': '#f3f4f5',
        'secondary-fixed-dim': '#bfc7d2',
        'surface': '#f8f9fa',
        'tertiary-fixed-dim': '#ffb59b',
        'on-primary': '#ffffff',
        'error': '#ba1a1a',
        'on-surface': '#191c1d',
        'on-surface-variant': '#434651',
        'secondary-fixed': '#dbe3ee',
        'on-primary-fixed': '#001946',
        'primary': '#001f54',
        'inverse-on-surface': '#f0f1f2',
        'secondary-container': '#dbe3ee',
        'primary-container': '#003380',
        'on-background': '#191c1d',
        'surface-variant': '#e1e3e4',
        'surface-dim': '#d9dadb',
        'on-secondary-fixed': '#141c24',
        'on-error-container': '#93000a',
        'on-primary-fixed-variant': '#1b4390',
        'secondary': '#575f68',
        'inverse-primary': '#b1c5ff',
        'surface-bright': '#f8f9fa',
        'error-container': '#ffdad6',
        'on-secondary-fixed-variant': '#3f4850',
        'surface-container-lowest': '#ffffff',
        'background': '#f8f9fa',
        'on-secondary-container': '#5d656e',
        'tertiary-container': '#672001',
        'surface-tint': '#385ba9',
        'outline-variant': '#c4c6d3',
        'on-primary-container': '#7e9ff2',
        'inverse-surface': '#2e3132',
        'on-secondary': '#ffffff',
      },

      /* 圆角 */
      borderRadius: {
        DEFAULT: '0.125rem',
        lg: '0.25rem',
        xl: '0.5rem',
        full: '0.75rem',
      },

      /* 间距 token */
      spacing: {
        'margin-desktop': '40px',
        'margin-mobile': '16px',
        'container-max': '1200px',
        'base': '8px',
        'gutter': '24px',
      },

      /* 字体族 */
      fontFamily: {
        'label-md': ['Work Sans'],
        'label-sm': ['Work Sans'],
        'body-lg': ['Hanken Grotesk'],
        'headline-lg-mobile': ['Hanken Grotesk'],
        'headline-lg': ['Hanken Grotesk'],
        'headline-md': ['Hanken Grotesk'],
        'body-md': ['Hanken Grotesk'],
        'headline-xl': ['Hanken Grotesk'],
      },

      /* 字号 token */
      fontSize: {
        'label-md': ['14px', { lineHeight: '20px', letterSpacing: '0.01em', fontWeight: '500' }],
        'label-sm': ['12px', { lineHeight: '16px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'headline-lg-mobile': ['28px', { lineHeight: '34px', fontWeight: '600' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'headline-xl': ['40px', { lineHeight: '48px', letterSpacing: '-0.02em', fontWeight: '700' }],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
};

export default config;
