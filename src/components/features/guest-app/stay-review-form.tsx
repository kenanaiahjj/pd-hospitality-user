'use client';

import { ArrowLeft, ArrowRight, CheckCircle, Star } from '@phosphor-icons/react';
import { useState, type FormEvent } from 'react';
import type { StayReview } from './prototype-model';

const RATINGS = [1, 2, 3, 4, 5] as const;

export type StayReviewFormProps = {
  mode: 'feed' | 'page';
  property: string;
  review?: StayReview;
  isCheckoutDay?: boolean;
  onSubmit: (rating: StayReview['rating'], comment: string) => void;
  onBackToMyStay?: () => void;
};

export function StayReviewForm({
  mode,
  property,
  review,
  isCheckoutDay = false,
  onSubmit,
  onBackToMyStay,
}: StayReviewFormProps) {
  const [rating, setRating] = useState<StayReview['rating'] | null>(null);
  const [comment, setComment] = useState('');
  const title = isCheckoutDay ? 'How was your stay?' : 'How has your stay been?';
  const titleId = `${mode}-stay-review-title`;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (rating === null) return;
    onSubmit(rating, comment.trim());
  };

  const content = review ? (
    <div className={`stay-review-form__thanks stay-review-form__thanks--${mode}`} role="status" aria-live="polite">
      <CheckCircle weight="fill" aria-hidden="true" />
      {mode === 'page' ? <h1 id={titleId}>Thank you</h1> : <h2 id={titleId}>Thank you</h2>}
      <p>Your feedback is saved with this stay. Only the property sees this.</p>
      {mode === 'page' ? (
        <button className="guest-button guest-button--secondary" type="button" onClick={onBackToMyStay}>
          <ArrowLeft aria-hidden="true" />Back to my stay
        </button>
      ) : null}
    </div>
  ) : (
    <form className={`stay-review-form__form stay-review-form__form--${mode}`} onSubmit={submit}>
      <header className={mode === 'feed' ? 'stay-feedback-reel__heading' : 'guest-page-title'}>
        {mode === 'feed' ? <h2 id={titleId}>{title}</h2> : <h1 id={titleId}>{title}</h1>}
        <p>{isCheckoutDay ? `Leave a rating or a note for ${property}.` : 'Before you head home, leave a rating or a note.'}</p>
      </header>

      <fieldset className="stay-review-form__rating">
        <legend>Rate your stay</legend>
        <div className="stay-review-form__stars">
          {RATINGS.map((value) => (
            <label className="stay-review-form__star" key={value}>
              <input
                className="guest-visually-hidden"
                type="radio"
                name={`${mode}-stay-review-rating`}
                value={value}
                aria-label={`${value} stars`}
                checked={rating === value}
                onChange={() => setRating(value)}
              />
              <span aria-hidden="true">
                <Star weight={rating !== null && value <= rating ? 'fill' : 'regular'} />
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="stay-review-form__note" htmlFor={`${mode}-stay-review-note`}>
        <span>Anything you&rsquo;d like the property to know? <small>Optional</small></span>
        <textarea
          id={`${mode}-stay-review-note`}
          name="comment"
          value={comment}
          onChange={(event) => setComment(event.currentTarget.value)}
          placeholder="Add a note about your stay"
          maxLength={800}
          rows={3}
        />
      </label>

      <button
        className={mode === 'feed' ? 'stay-feedback-reel__submit' : 'guest-button guest-button--primary'}
        type="submit"
        disabled={rating === null}
      >
        Send to the property<ArrowRight aria-hidden="true" />
      </button>
      <p className={mode === 'feed' ? 'stay-feedback-reel__privacy' : 'stay-review-form__privacy'}>
        Only the property sees this.
      </p>
    </form>
  );

  if (mode === 'feed') {
    return (
      <section className="stay-feedback-reel" aria-labelledby={titleId}>
        {content}
      </section>
    );
  }

  return (
    <div className="guest-stack guest-stay-review">
      {onBackToMyStay ? (
        <button className="guest-stay-review__back" type="button" onClick={onBackToMyStay}>
          <ArrowLeft aria-hidden="true" />My stay
        </button>
      ) : null}
      {content}
    </div>
  );
}
