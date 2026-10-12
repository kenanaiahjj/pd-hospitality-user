import './cabana-wax-seal.css';

/** The alternate wax-seal treatment, kept separate from the booking-card stamp. */
export function CabanaWaxSeal({ className = '' }: { className?: string }) {
  return (
    <span className={`cabana-wax-seal ${className}`.trim()} role="img" aria-label="Cabana wax seal" />
  );
}
