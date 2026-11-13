import type { Preview } from '@storybook/nextjs-vite'
import { Newsreader } from 'next/font/google';
import { QueryProvider } from '@/lib/queries/provider';
import '../src/app/globals.css';
import './preview.css';

const serif = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const preview: Preview = {
  decorators: [
    (Story) => (
      <div className={serif.variable}>
        <QueryProvider>
          <Story />
        </QueryProvider>
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
    options: {
      storySort: {
        order: ['Cabana', ['Pages', 'Patterns', 'Design system']],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
};

export default preview;
