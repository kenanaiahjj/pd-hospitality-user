import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { BOOKING_TRANSITIONS } from '@/components/features/guest-app/pilot/rules';
import { BookingSpecimen } from '@/app/states/engine';

const auxiliaryStates = [
  'needs-approval',
  'pay-or-cancel',
  'extra-charge',
  'damage-claim',
  'refund-failed',
  'pms-pending',
];
const stateOptions = [...new Set([...auxiliaryStates, ...Object.keys(BOOKING_TRANSITIONS)])];

type BookingArgs = { state: string };

function BookingMachine({ state }: BookingArgs) {
  return (
    <div className="storybook-state-card">
      <header className="storybook-state-card__heading">
        <h2>Vendor booking</h2>
        <p>Select an initial state, then advance it with real engine events.</p>
      </header>
      <BookingSpecimen key={state} state={state} onState={() => undefined} />
    </div>
  );
}

const meta = {
  title: 'Cabana/Patterns/Booking lifecycle',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'The booking card is shown with its real host engine, transition rules, and event controls. Use Controls to seed a state, then use the event buttons to explore valid changes.',
      },
    },
  },
  argTypes: {
    state: {
      name: 'Initial booking state',
      control: 'select',
      options: stateOptions,
      description: 'Seed the engine with an existing or partner-event state.',
    },
  },
  args: { state: 'requested' },
  render: (args: BookingArgs) => <BookingMachine {...args} />,
} satisfies Meta<BookingArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BookingCard: Story = {
  name: 'Booking card · transitions and event history',
};

export const PaymentPending: Story = {
  name: 'Payment · awaiting card payment',
  args: { state: 'awaiting-payment' },
};

export const DeskApproval: Story = {
  name: 'Desk approval · decision required',
  args: { state: 'needs-approval' },
};
