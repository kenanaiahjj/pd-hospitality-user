import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatComposer, type ChatComposerSubmit } from './chat-composer';

const renderComposer = (onSubmit: (payload: ChatComposerSubmit) => void = vi.fn()) => {
  const onDraftChange = vi.fn();
  render(<ChatComposer draft="" onDraftChange={onDraftChange} onSubmit={onSubmit} />);
  return { onDraftChange };
};

describe('ChatComposer', () => {
  const urlMethodDescriptors = {
    createObjectURL: Object.getOwnPropertyDescriptor(URL, 'createObjectURL'),
    revokeObjectURL: Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL'),
  };

  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:chat-test'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    if (urlMethodDescriptors.createObjectURL) {
      Object.defineProperty(URL, 'createObjectURL', urlMethodDescriptors.createObjectURL);
    } else {
      Reflect.deleteProperty(URL, 'createObjectURL');
    }
    if (urlMethodDescriptors.revokeObjectURL) {
      Object.defineProperty(URL, 'revokeObjectURL', urlMethodDescriptors.revokeObjectURL);
    } else {
      Reflect.deleteProperty(URL, 'revokeObjectURL');
    }
    vi.restoreAllMocks();
  });

  it('previews, removes, and sends one selected image', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderComposer(onSubmit);
    const file = new File(['room photo'], 'room.jpg', { type: 'image/jpeg' });

    fireEvent.change(screen.getByLabelText('Choose an image to attach'), { target: { files: [file] } });
    expect(screen.getByRole('region', { name: 'Pending attachment' })).toHaveTextContent('room.jpg');
    await user.click(screen.getByRole('button', { name: 'Remove attachment' }));
    expect(screen.queryByRole('region', { name: 'Pending attachment' })).toBeNull();

    fireEvent.change(screen.getByLabelText('Choose an image to attach'), { target: { files: [file] } });
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    expect(onSubmit).toHaveBeenCalledWith({
      body: '',
      attachment: { kind: 'image', url: 'blob:chat-test', name: 'room.jpg' },
    });
  });

  it('rejects non-images and images over 10 MB', () => {
    renderComposer();
    fireEvent.change(screen.getByLabelText('Choose an image to attach'), {
      target: { files: [new File(['text'], 'notes.txt', { type: 'text/plain' })] },
    });
    expect(screen.getByRole('status')).toHaveTextContent('Choose an image file.');

    const largeFile = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Choose an image to attach'), { target: { files: [largeFile] } });
    expect(screen.getByRole('status')).toHaveTextContent('Images must be 10 MB or smaller.');
  });

  it('records, previews, and sends a voice message', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    class MockMediaRecorder {
      static isTypeSupported = vi.fn(() => true);
      state = 'inactive';
      mimeType = 'audio/webm';
      ondataavailable?: (event: { data: Blob }) => void;
      onstop?: () => void;
      start = vi.fn(() => {
        this.state = 'recording';
      });
      stop = vi.fn(() => {
        this.state = 'inactive';
        this.ondataavailable?.({ data: new Blob(['voice'], { type: 'audio/webm' }) });
        this.onstop?.();
      });
    }
    vi.stubGlobal('MediaRecorder', MockMediaRecorder);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }) },
    });
    renderComposer(onSubmit);

    await user.click(screen.getByRole('button', { name: 'Start voice recording' }));
    expect(screen.getByRole('status')).toHaveTextContent('Recording');
    await user.click(screen.getByRole('button', { name: 'Stop recording' }));
    expect(screen.getByRole('region', { name: 'Pending attachment' })).toHaveTextContent('Voice message');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        body: '',
        attachment: expect.objectContaining({ kind: 'audio', name: 'Voice message' }),
      }),
    );
  });

  it('announces microphone denial and leaves text entry available', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('MediaRecorder', class MockMediaRecorder {});
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    renderComposer();

    await user.click(screen.getByRole('button', { name: 'Start voice recording' }));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Microphone access was denied. You can type or attach an image instead.',
    );
    expect(screen.getByRole('textbox', { name: 'Message the front desk' })).toBeEnabled();
  });
});
