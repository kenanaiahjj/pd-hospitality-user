import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    {
      name: '@storybook/addon-mcp',
      options: {
        toolsets: {
          dev: true,
          docs: true,
          test: false,
        },
      },
    },
  ],
  framework: '@storybook/nextjs-vite',
  staticDirs: ['../public'],
  features: {
    componentsManifest: true,
  },
};

export default config;
