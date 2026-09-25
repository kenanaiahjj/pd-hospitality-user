'use client';

import { useRef, type KeyboardEvent, type ReactNode } from 'react';

export type GuestTabOption<Value extends string = string> = {
  value: Value;
  label: ReactNode;
};

export type GuestTabsProps<Value extends string> = {
  idPrefix: string;
  label: string;
  options: readonly GuestTabOption<Value>[];
  value: Value;
  onValueChange: (value: Value) => void;
  className?: string;
};

export function GuestTabs<Value extends string>({
  idPrefix,
  label,
  options,
  value,
  onValueChange,
  className,
}: GuestTabsProps<Value>) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (options.length === 0) return;

    let nextIndex = index;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % options.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + options.length) % options.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = options.length - 1;
    else return;

    event.preventDefault();
    const nextOption = options[nextIndex];
    if (!nextOption) return;
    onValueChange(nextOption.value);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      id={`${idPrefix}-tablist`}
      className={['guest-tabs', className].filter(Boolean).join(' ')}
      role="tablist"
      aria-label={label}
      aria-orientation="horizontal"
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          ref={(node) => { tabRefs.current[index] = node; }}
          id={`${idPrefix}-tab-${option.value}`}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          aria-controls={`${idPrefix}-panel-${option.value}`}
          tabIndex={index === selectedIndex ? 0 : -1}
          className="guest-tab"
          onClick={() => onValueChange(option.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
