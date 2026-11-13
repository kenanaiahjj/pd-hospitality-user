import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DesignSystemGallery } from '@/components/features/design-system';

const meta = {
  title: 'Cabana/Design system/Component gallery',
  component: DesignSystemGallery,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The existing Cabana design-system page, including shared tokens, control states, and interactive examples.',
      },
    },
  },
} satisfies Meta<typeof DesignSystemGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {};
