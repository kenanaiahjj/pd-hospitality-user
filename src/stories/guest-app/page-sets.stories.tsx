import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { applyPrototypeStayState, SCREENS, type PrototypeStayState } from '@/components/features/guest-app/prototype-model';
import { GuestAppPrototype } from '@/components/features/guest-app/guest-app-prototype';
import type { ActiveScreen } from '@/components/features/guest-app/guest-shared';
import screenIds from '@/app/states/screen-inventory.json';

const stayProfiles: PrototypeStayState[] = [
  'signed-out',
  'account-only',
  'pre-arrival',
  'arrived',
  'live',
  'checkout-day',
  'just-checked-out',
  'closed',
];

const screenOptions = [...screenIds] as ActiveScreen[];
const screenLabels = Object.fromEntries(screenOptions.map((id) => [
  id,
  SCREENS.find((screen) => screen.id === id)?.title ?? id.replaceAll('-', ' '),
]));

type PageSetArgs = {
  screen: ActiveScreen;
  stay: PrototypeStayState;
  online: boolean;
};

function GuestPageSet({ screen, stay, online }: PageSetArgs) {
  return (
    <GuestAppPrototype
      key={`${screen}:${stay}:${online}`}
      initialScreen={screen}
      initialSession={applyPrototypeStayState(stay)}
      initialOnline={online}
    />
  );
}

const meta = {
  title: 'Cabana/Pages/Guest app',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Each canvas renders the production guest app inside its selected page context. Use Controls to browse all registered screens, stay lifecycles, and online/offline presentation.',
      },
    },
  },
  argTypes: {
    screen: {
      name: 'Page',
      control: { type: 'select', labels: screenLabels },
      options: screenOptions,
      description: 'Open a real application screen inside the guest app shell.',
    },
    stay: {
      name: 'Stay context',
      control: {
        type: 'select',
        labels: {
          'signed-out': 'Signed out',
          'account-only': 'Account, no booking',
          'pre-arrival': 'Before arrival',
          arrived: 'Arrived, not scanned',
          live: 'During stay',
          'checkout-day': 'Checkout day',
          'just-checked-out': 'Recently checked out',
          closed: 'Past the desk window',
        },
      },
      options: stayProfiles,
      description: 'Seed the page with a realistic guest, stay, and booking context.',
    },
    online: {
      name: 'Connection',
      control: 'boolean',
      description: 'Show online or offline app presentation.',
    },
  },
  args: {
    screen: 'stay-overview',
    stay: 'live',
    online: true,
  },
  render: (args: PageSetArgs) => <GuestPageSet {...args} />,
} satisfies Meta<PageSetArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ScreenCatalog: Story = {
  name: 'All screens · choose a page',
  parameters: {
    docs: {
      description: {
        story: 'Use the Page control to browse every registered screen with a full guest app shell and the selected stay context.',
      },
    },
  },
};

export const BookingLookup: Story = {
  name: 'Entry · booking lookup',
  args: { screen: 'identify', stay: 'account-only' },
};

export const StayBeforeArrival: Story = {
  name: 'Stay · before arrival',
  args: { screen: 'stay-overview', stay: 'pre-arrival' },
};

export const StayDuringVisit: Story = {
  name: 'Stay · during the visit',
  args: { screen: 'my-stay', stay: 'live' },
};

export const ExploreServices: Story = {
  name: 'Services · explore and browse',
  args: { screen: 'marketplace', stay: 'live' },
};

export const ServiceReservation: Story = {
  name: 'Services · booking details',
  args: { screen: 'service-booking', stay: 'live' },
};

export const RoomCharges: Story = {
  name: 'Folio · room charges',
  args: { screen: 'folio', stay: 'live' },
};

export const FrontDeskChat: Story = {
  name: 'Messages · front desk',
  args: { screen: 'chat', stay: 'live' },
};

export const GuestProfile: Story = {
  name: 'Account · guest profile',
  args: { screen: 'profile', stay: 'live' },
};

export const CheckoutReview: Story = {
  name: 'Checkout · stay review',
  args: { screen: 'stay-review', stay: 'checkout-day' },
};
