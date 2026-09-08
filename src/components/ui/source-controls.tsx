'use client';

import { forwardRef, useId } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { CaretDown, Check, MagnifyingGlass, Plus, Star } from '@phosphor-icons/react';
import { cn } from '@/lib/utils/cn';
import { DEFAULT_COLOR_PICKER_VALUE } from '@/lib/design-system';
import { useControllableState } from './source-primitives';

export interface SourceButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const SourceButton = forwardRef<HTMLButtonElement, SourceButtonProps>(function SourceButton(
  {
    children,
    className,
    variant = 'primary',
    size = 'md',
    leadingIcon,
    trailingIcon,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn('source-button', className)}
    >
      {leadingIcon}
      <span>{children}</span>
      {trailingIcon}
    </button>
  );
});

export interface SourceAccordionProps {
  title: string;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function SourceAccordion({ title, children, open, defaultOpen = false, onOpenChange, className }: SourceAccordionProps) {
  const panelId = useId();
  const [isOpen, setIsOpen] = useControllableState(open, defaultOpen, onOpenChange);

  return (
    <div data-slot="accordion" className={cn('source-accordion', className)}>
      <button
        type="button"
        className="source-accordion__trigger"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <CaretDown aria-hidden="true" className={cn('source-accordion__icon', isOpen && 'is-open')} />
      </button>
      <div id={panelId} className="source-accordion__panel" hidden={!isOpen}>
        {children}
      </div>
    </div>
  );
}

export interface SourceCheckboxProps {
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function SourceCheckbox({
  label,
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled,
  className,
}: SourceCheckboxProps) {
  const id = useId();
  const [value, setValue] = useControllableState(checked, defaultChecked, onCheckedChange);

  return (
    <label data-slot="checkbox" htmlFor={id} className={cn('source-checkbox', className, disabled && 'is-disabled')}>
      <input
        id={id}
        type="checkbox"
        checked={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.checked)}
      />
      <span className="source-checkbox__box" aria-hidden="true">
        <Check weight="bold" />
      </span>
      <span className="source-checkbox__label">{label}</span>
    </label>
  );
}

export interface SourceColorPickerProps {
  label?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SourceColorPicker({
  label = 'Accent color',
  value,
  defaultValue = DEFAULT_COLOR_PICKER_VALUE,
  onValueChange,
  disabled,
  className,
}: SourceColorPickerProps) {
  const id = useId();
  const [color, setColor] = useControllableState(value, defaultValue, onValueChange);

  return (
    <label data-slot="color-picker" htmlFor={id} className={cn('source-color-picker', className, disabled && 'is-disabled')}>
      <span className="source-color-picker__label">{label}</span>
      <span className="source-color-picker__value">
        <span className="source-color-picker__swatch" style={{ backgroundColor: color }} aria-hidden="true" />
        <span>{color.toUpperCase()}</span>
        <input
          id={id}
          type="color"
          value={color}
          disabled={disabled}
          aria-label={label}
          onChange={(event) => setColor(event.target.value)}
        />
      </span>
    </label>
  );
}

export interface SourceDatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange'> {
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  hint?: string;
  className?: string;
}

export function SourceDatePicker({ label, value, defaultValue = '', onValueChange, hint, className, ...props }: SourceDatePickerProps) {
  const id = useId();
  const [date, setDate] = useControllableState(value, defaultValue, onValueChange);

  return (
    <label data-slot="date-picker" htmlFor={id} className={cn('source-date-picker', className)}>
      <span className="source-date-picker__label">{label}</span>
      <input {...props} id={id} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      {hint ? <span className="source-date-picker__hint">{hint}</span> : null}
    </label>
  );
}

export interface SourceRadioOption {
  value: string;
  label: string;
}

export interface SourceRadioGroupProps {
  label?: string;
  options: SourceRadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SourceRadioGroup({
  label = 'Choose one',
  options,
  value,
  defaultValue,
  onValueChange,
  disabled,
  className,
}: SourceRadioGroupProps) {
  const groupId = useId();
  const [selectedValue, setSelectedValue] = useControllableState(value, defaultValue ?? options[0]?.value ?? '', onValueChange);

  return (
    <fieldset data-slot="radio-group" className={cn('source-radio-group', className)} disabled={disabled}>
      <legend>{label}</legend>
      <div className="source-radio-group__options">
        {options.map((option) => {
          const id = `${groupId}-${option.value}`;
          return (
            <label key={option.value} htmlFor={id} className="source-radio">
              <input
                id={id}
                type="radio"
                name={groupId}
                value={option.value}
                checked={selectedValue === option.value}
                onChange={() => setSelectedValue(option.value)}
              />
              <span className="source-radio__dot" aria-hidden="true" />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export interface SourceRatingControlProps {
  label?: string;
  value?: number;
  defaultValue?: number;
  max?: number;
  onValueChange?: (value: number) => void;
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SourceRatingControl({
  label = 'Rating',
  value,
  defaultValue = 4,
  max = 5,
  onValueChange,
  readOnly,
  disabled,
  className,
}: SourceRatingControlProps) {
  const [rating, setRating] = useControllableState(value, defaultValue, onValueChange);

  return (
    <div data-slot="rating-control" className={cn('source-rating', className)} role="group" aria-label={label}>
      <span className="source-rating__label">{label}</span>
      <span className="source-rating__stars">
        {Array.from({ length: max }, (_, index) => {
          const nextRating = index + 1;
          const active = nextRating <= rating;
          return (
            <button
              key={nextRating}
              type="button"
              className={cn('source-rating__star', active && 'is-active')}
              aria-label={`${nextRating} of ${max} stars`}
              aria-pressed={active}
              disabled={disabled || readOnly}
              onClick={() => setRating(nextRating)}
            >
              <Star weight={active ? 'fill' : 'regular'} />
            </button>
          );
        })}
      </span>
      <span className="source-rating__value">{rating.toFixed(1)}</span>
    </div>
  );
}

export interface SourceSearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export const SourceSearchBar = forwardRef<HTMLInputElement, SourceSearchBarProps>(function SourceSearchBar(
  { className, value, defaultValue = '', onValueChange, placeholder = 'Search components', ...props },
  ref,
) {
  const [searchValue, setSearchValue] = useControllableState(value, defaultValue, onValueChange);

  return (
    <label data-slot="search-bar" className={cn('source-search-bar', className)}>
      <MagnifyingGlass aria-hidden="true" />
      <input
        {...props}
        ref={ref}
        type="search"
        value={searchValue}
        placeholder={placeholder}
        onChange={(event) => setSearchValue(event.target.value)}
      />
    </label>
  );
});

export interface SourceSegmentedControlProps {
  label?: string;
  options: SourceRadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function SourceSegmentedControl({
  label = 'View',
  options,
  value,
  defaultValue,
  onValueChange,
  className,
}: SourceSegmentedControlProps) {
  const [selectedValue, setSelectedValue] = useControllableState(value, defaultValue ?? options[0]?.value ?? '', onValueChange);

  return (
    <div data-slot="segmented-control" className={cn('source-segmented-control', className)} role="tablist" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={selectedValue === option.value}
          data-state={selectedValue === option.value ? 'active' : 'inactive'}
          onClick={() => setSelectedValue(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export interface SourceSliderProps {
  label: string;
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export function SourceSlider({ label, value, defaultValue = 50, min = 0, max = 100, step = 1, onValueChange, disabled, className }: SourceSliderProps) {
  const [sliderValue, setSliderValue] = useControllableState(value, defaultValue, onValueChange);

  return (
    <label data-slot="slider" className={cn('source-slider', className)}>
      <span className="source-slider__header">
        <span>{label}</span>
        <output>{sliderValue}</output>
      </span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={sliderValue}
        disabled={disabled}
        onChange={(event) => setSliderValue(Number(event.target.value))}
      />
    </label>
  );
}

export interface SourceFloatingActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: ReactNode;
}

export function SourceFloatingActionButton({ label, icon = <Plus weight="bold" aria-hidden="true" />, className, ...props }: SourceFloatingActionButtonProps) {
  return (
    <button
      {...props}
      type="button"
      data-slot="floating-action-button"
      aria-label={label}
      title={label}
      className={cn('source-floating-action-button', className)}
    >
      {icon}
    </button>
  );
}

export interface SourceSwitchProps {
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function SourceSwitch({
  label,
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled,
  className,
}: SourceSwitchProps) {
  const [value, setValue] = useControllableState(checked, defaultChecked, onCheckedChange);

  return (
    <button
      type="button"
      data-slot="switch"
      role="switch"
      aria-checked={value}
      disabled={disabled}
      className={cn('source-switch', value && 'is-checked', className)}
      onClick={() => setValue(!value)}
    >
      <span className="source-switch__label">{label}</span>
      <span className="source-switch__track" aria-hidden="true">
        <span className="source-switch__thumb" />
      </span>
    </button>
  );
}

export interface SourceTabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  active?: boolean;
}

export function SourceTab({ label, active, className, ...props }: SourceTabProps) {
  return (
    <button
      {...props}
      type="button"
      role="tab"
      aria-selected={active}
      data-slot="tab"
      data-state={active ? 'active' : 'inactive'}
      className={cn('source-tab', className)}
    >
      {label}
    </button>
  );
}

export interface SourceTextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const SourceTextField = forwardRef<HTMLInputElement, SourceTextFieldProps>(function SourceTextField(
  { label, hint, error, id: providedId, className, ...props },
  ref,
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <label data-slot="text-field" htmlFor={id} className={cn('source-text-field', error && 'has-error', className)}>
      <span className="source-text-field__label">{label}</span>
      <input
        {...props}
        ref={ref}
        id={id}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        aria-invalid={Boolean(error)}
      />
      {error ? <span id={errorId} className="source-text-field__message">{error}</span> : null}
      {!error && hint ? <span id={hintId} className="source-text-field__hint">{hint}</span> : null}
    </label>
  );
});

export interface SourceTileProps {
  title: string;
  description?: string;
  selected?: boolean;
  defaultSelected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  icon?: ReactNode;
  className?: string;
}

export function SourceTile({
  title,
  description,
  selected,
  defaultSelected = false,
  onSelectedChange,
  icon,
  className,
}: SourceTileProps) {
  const [isSelected, setIsSelected] = useControllableState(selected, defaultSelected, onSelectedChange);

  return (
    <button
      type="button"
      data-slot="tile"
      aria-pressed={isSelected}
      className={cn('source-tile', isSelected && 'is-selected', className)}
      onClick={() => setIsSelected(!isSelected)}
    >
      {icon ? <span className="source-tile__icon">{icon}</span> : null}
      <span className="source-tile__copy">
        <strong>{title}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      <span className="source-tile__indicator" aria-hidden="true">
        <Check weight="bold" />
      </span>
    </button>
  );
}
