'use client';

import { ArrowRight, Microphone, Paperclip, Stop, TrashSimple } from '@phosphor-icons/react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

export type ChatAttachment = {
  kind: 'image' | 'audio';
  url: string;
  name: string;
  duration?: number;
};

export type ChatComposerSubmit = {
  body: string;
  attachment?: ChatAttachment;
};

export const MAX_CHAT_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_CHAT_RECORDING_SECONDS = 30;

const IMAGE_ERROR = 'Choose an image file.';
const IMAGE_SIZE_ERROR = 'Images must be 10 MB or smaller.';
const MICROPHONE_DENIED_ERROR = "Microphone access was denied. You can type or attach an image instead.";
const VOICE_UNAVAILABLE_ERROR = "Voice recording isn't available on this device. You can type or attach an image instead.";

type ChatComposerProps = {
  disabled?: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (payload: ChatComposerSubmit) => void;
};

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainder = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
};

export function ChatComposer({ disabled = false, draft, onDraftChange, onSubmit }: ChatComposerProps) {
  const [pendingAttachment, setPendingAttachment] = useState<ChatAttachment | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const discardRecordingRef = useRef(false);
  const recordingSecondsRef = useRef(0);
  const pendingAttachmentRef = useRef<ChatAttachment | null>(null);
  const mountedRef = useRef(true);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const replacePendingAttachment = useCallback((attachment: ChatAttachment | null) => {
    const previous = pendingAttachmentRef.current;
    if (previous && previous.url !== attachment?.url) {
      URL.revokeObjectURL(previous.url);
    }
    pendingAttachmentRef.current = attachment;
    setPendingAttachment(attachment);
  }, []);

  const finishRecording = useCallback(() => {
    const recorder = recorderRef.current;
    const chunks = recordingChunksRef.current;
    const shouldDiscard = discardRecordingRef.current;
    const duration = recordingSecondsRef.current;
    const mimeType = recorder?.mimeType || 'audio/webm';

    recorderRef.current = null;
    recordingChunksRef.current = [];
    discardRecordingRef.current = false;
    releaseStream();
    setIsRecording(false);
    setRecordingSeconds(0);
    recordingSecondsRef.current = 0;

    if (shouldDiscard) return;
    if (!chunks.length) {
      setMediaError('No audio was recorded. Try again.');
      return;
    }

    const audioUrl = URL.createObjectURL(new Blob(chunks, { type: mimeType }));
    replacePendingAttachment({ kind: 'audio', url: audioUrl, name: 'Voice message', duration });
  }, [releaseStream, replacePendingAttachment]);

  const stopRecording = useCallback((discard = false) => {
    const recorder = recorderRef.current;
    discardRecordingRef.current = discard;
    if (!recorder) {
      releaseStream();
      setIsRecording(false);
      return;
    }

    if (recorder.state === 'inactive') {
      finishRecording();
      return;
    }

    try {
      recorder.stop();
    } catch {
      finishRecording();
    }
  }, [finishRecording, releaseStream]);

  useEffect(() => {
    if (!isRecording) return undefined;

    const intervalId = window.setInterval(() => {
      setRecordingSeconds((current) => {
        const next = Math.min(MAX_CHAT_RECORDING_SECONDS, current + 1);
        recordingSecondsRef.current = next;
        return next;
      });
    }, 1000);
    const timeoutId = window.setTimeout(() => {
      recordingSecondsRef.current = MAX_CHAT_RECORDING_SECONDS;
      setRecordingSeconds(MAX_CHAT_RECORDING_SECONDS);
      stopRecording();
    }, MAX_CHAT_RECORDING_SECONDS * 1000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [isRecording, stopRecording]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      discardRecordingRef.current = true;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        try {
          recorder.stop();
        } catch {
          // The stream cleanup below still releases the microphone if stop fails.
        }
      }
      releaseStream();
      if (pendingAttachmentRef.current) {
        URL.revokeObjectURL(pendingAttachmentRef.current.url);
        pendingAttachmentRef.current = null;
      }
    };
  }, [releaseStream]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMediaError(IMAGE_ERROR);
      return;
    }
    if (file.size > MAX_CHAT_IMAGE_BYTES) {
      setMediaError(IMAGE_SIZE_ERROR);
      return;
    }

    try {
      const imageUrl = URL.createObjectURL(file);
      replacePendingAttachment({ kind: 'image', url: imageUrl, name: file.name });
      setMediaError(null);
    } catch {
      setMediaError('That image could not be attached. Try another file.');
    }
  };

  const startRecording = async () => {
    if (disabled || isRecording) return;

    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMediaError(VOICE_UNAVAILABLE_ERROR);
      return;
    }

    setMediaError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMediaError(MICROPHONE_DENIED_ERROR);
      return;
    }

    if (!mountedRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    try {
      const recorderOptions = MediaRecorder.isTypeSupported?.('audio/webm')
        ? { mimeType: 'audio/webm' }
        : undefined;
      const recorder = recorderOptions ? new MediaRecorder(stream, recorderOptions) : new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      recordingChunksRef.current = [];
      discardRecordingRef.current = false;
      recordingSecondsRef.current = 0;
      setRecordingSeconds(0);
      setIsRecording(true);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = finishRecording;
      recorder.start();
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      setMediaError(VOICE_UNAVAILABLE_ERROR);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled || isRecording) return;

    const body = draft.trim();
    if (!body && !pendingAttachment) return;

    const attachment = pendingAttachment;
    pendingAttachmentRef.current = null;
    setPendingAttachment(null);
    setMediaError(null);
    onSubmit(attachment ? { body, attachment } : { body });
    onDraftChange('');
  };

  const canSend = Boolean(draft.trim() || pendingAttachment);

  return (
    <form className="guest-composer" onSubmit={handleSubmit}>
      {pendingAttachment ? (
        <div className="guest-composer__pending" role="region" aria-label="Pending attachment">
          {pendingAttachment.kind === 'image' ? (
            <Image
              src={pendingAttachment.url}
              alt={pendingAttachment.name}
              width={48}
              height={48}
              unoptimized
            />
          ) : (
            <audio controls src={pendingAttachment.url} aria-label="Voice message preview" preload="metadata" />
          )}
          <span className="guest-composer__pending-name">{pendingAttachment.name}</span>
          <button
            className="guest-composer__remove"
            type="button"
            aria-label="Remove attachment"
            onClick={() => {
              replacePendingAttachment(null);
              setMediaError(null);
            }}
          >
            <TrashSimple aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {isRecording ? (
        <div className="guest-composer__recording" role="status" aria-live="polite">
          <span>Recording · {formatDuration(recordingSeconds)}</span>
          <button
            className="guest-composer__recording-control"
            type="button"
            aria-label="Stop recording"
            onClick={() => stopRecording()}
          >
            <Stop aria-hidden="true" />
          </button>
          <button className="guest-composer__cancel" type="button" onClick={() => stopRecording(true)}>
            Cancel recording
          </button>
        </div>
      ) : null}

      {mediaError ? <div className="guest-composer__status" role="status" aria-live="polite">{mediaError}</div> : null}

      <div className="guest-composer__row">
        <button
          className="guest-composer__tool"
          type="button"
          aria-label="Attach an image"
          disabled={disabled || isRecording}
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip aria-hidden="true" />
        </button>
        <input
          ref={fileInputRef}
          className="sr-only"
          type="file"
          accept="image/*"
          capture="environment"
          aria-label="Choose an image to attach"
          disabled={disabled || isRecording}
          onChange={handleImageChange}
        />
        <label className="sr-only" htmlFor="message">Message the front desk</label>
        <input
          className="guest-composer__text-input"
          id="message"
          name="message"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder={disabled ? 'Chat is unavailable' : 'Ask the front desk'}
          disabled={disabled || isRecording}
        />
        <button
          className="guest-composer__submit"
          type="submit"
          aria-label={canSend ? 'Send message' : 'Start voice recording'}
          disabled={disabled || isRecording}
          onClick={canSend ? undefined : (event) => {
            event.preventDefault();
            void startRecording();
          }}
        >
          {canSend ? <ArrowRight aria-hidden="true" /> : <Microphone aria-hidden="true" />}
        </button>
      </div>
    </form>
  );
}
