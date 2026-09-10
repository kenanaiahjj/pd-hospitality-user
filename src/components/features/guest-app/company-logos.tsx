import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type LogoProps = ComponentPropsWithoutRef<'svg'> & {
  size?: number;
};

/**
 * Philippine Airlines (PR)
 * Flag carrier of the Philippines. Official navy sunburst and crimson sail emblem.
 */
export function PhilippineAirlinesLogo({ size = 32, className, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect width="32" height="32" rx="8" fill="#FFFFFF" />
      <rect width="32" height="32" rx="8" stroke="#E6E8EB" strokeWidth="1" />
      {/* Sunburst (Golden Yellow) */}
      <circle cx="16" cy="16" r="4.5" fill="#FDB813" />
      <path
        d="M16 8.5V10.5M16 21.5V23.5M8.5 16H10.5M21.5 16H23.5M10.7 10.7L12.1 12.1M19.9 19.9L21.3 21.3M10.7 21.3L12.1 19.9M19.9 12.1L21.3 10.7"
        stroke="#FDB813"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Dynamic Sail Emblem (Crimson & Navy) */}
      <path
        d="M12 21.5C12.5 18 15 13 22 10.5C21 15 19 19.5 14.5 22L12 21.5Z"
        fill="#002D62"
      />
      <path
        d="M11 22.5C14 20 18 16.5 20.5 12C18 17 15.5 20.5 12 22.5H11Z"
        fill="#CE1126"
      />
    </svg>
  );
}

/**
 * Cebu Pacific (5J)
 * Philippines' largest low-cost airline. Signature bright yellow sun-sky and soaring eagle.
 */
export function CebuPacificLogo({ size = 32, className, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect width="32" height="32" rx="8" fill="#FFF8D6" />
      <rect width="32" height="32" rx="8" stroke="#F6D860" strokeWidth="1" />
      {/* Soaring Eagle & Sunrise Wing */}
      <path
        d="M6 18C10 13 18 10 26 12C21 14 16 16.5 12 22C10 20.5 8 19 6 18Z"
        fill="#00A3E0"
      />
      <path
        d="M8 20C12 16 19 14 24 16C19 18 16 20.5 13 24C11 22.5 9.5 21 8 20Z"
        fill="#FFB800"
      />
      <circle cx="21" cy="11" r="2.5" fill="#FFB800" />
    </svg>
  );
}

/**
 * AirAsia (Z2)
 * Signature bright red rounded badge with white logotype lettering.
 */
export function AirAsiaLogo({ size = 32, className, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect width="32" height="32" rx="8" fill="#ED1C24" />
      <path
        d="M8.5 19.5C9.5 16 11 13 13 11H15C13.5 14 12 17 11 20H8.5V19.5ZM13.5 16.5C14.5 15 16 14.5 17.5 14.5C19 14.5 20 15.5 19.5 17C19 18.5 17.5 19.5 16 19.5C14.5 19.5 14 18.5 13.5 16.5ZM21 11H23C22 14 21 17 20 20H18C19 17 20 14 21 11Z"
        fill="#FFFFFF"
      />
      <circle cx="23.5" cy="18.5" r="1.2" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * 2GO Travel
 * Philippines' largest passenger ferry network. Magenta & orange dynamic high-speed mark.
 */
export function TwoGoTravelLogo({ size = 32, className, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect width="32" height="32" rx="8" fill="#FFF0F6" />
      <rect width="32" height="32" rx="8" stroke="#F8B4D9" strokeWidth="1" />
      {/* 2GO Speed Mark */}
      <path
        d="M7 13.5C7 11 9 9.5 12 9.5C15 9.5 16.5 11 15 14L10.5 19H16.5V21.5H7.5L12 16C13.5 14 13.5 12.5 12 12.5C10.5 12.5 9.5 13 9.5 14L7 13.5Z"
        fill="#E20074"
      />
      <circle cx="21.5" cy="15.5" r="5" stroke="#FF6600" strokeWidth="2.5" />
      <path d="M21.5 13V18M19 15.5H24" stroke="#FF6600" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * OceanJet
 * High-speed fastcraft passenger catamaran fleet in the Visayas.
 */
export function OceanJetLogo({ size = 32, className, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect width="32" height="32" rx="8" fill="#EBF8FF" />
      <rect width="32" height="32" rx="8" stroke="#BAE3FF" strokeWidth="1" />
      {/* Fastcraft Wave Foil */}
      <path
        d="M6 19C10 19 13 14 18 14C23 14 24 16 26 15C24 18 20 20 16 20C11 20 9 17 6 19Z"
        fill="#0099DA"
      />
      <path
        d="M9 13.5C13 13.5 16 9.5 20 9.5C24 9.5 25 11 27 10.5C25 13 21.5 15 18 15C13.5 15 11.5 12.5 9 13.5Z"
        fill="#0B2545"
      />
      <circle cx="21" cy="22" r="1.5" fill="#0099DA" />
    </svg>
  );
}

/**
 * Lite Ferries
 * RoRo inter-island vessel specialist.
 */
export function LiteFerriesLogo({ size = 32, className, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect width="32" height="32" rx="8" fill="#F0F4F8" />
      <rect width="32" height="32" rx="8" stroke="#D1DEEB" strokeWidth="1" />
      {/* Anchor / Hull Emblem */}
      <path
        d="M16 7V19M16 19C12.5 19 9 16.5 7 13C8.5 19 12 22 16 22C20 22 23.5 19 25 13C23 16.5 19.5 19 16 19Z"
        stroke="#1B365D"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="9" r="2" fill="#F5B800" />
      <path d="M12 12H20" stroke="#1B365D" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Henry Fleet
 * Cabana & The Henry private luxury vehicle fleet. Chauffeur sedan, van & coaster.
 */
export function HenryFleetLogo({ size = 32, className, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect width="32" height="32" rx="8" fill="#FDF3F6" />
      <rect width="32" height="32" rx="8" stroke="#F5D0DD" strokeWidth="1" />
      {/* Elegant Cabana Plum Monogram "H" */}
      <path
        d="M10 9V23M22 9V23M10 16H22"
        stroke="#462133"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="11" r="1.5" fill="#CE1126" />
      <circle cx="16" cy="21" r="1.5" fill="#CE1126" />
    </svg>
  );
}

/**
 * Island Coach
 * Inter-island regional shuttle and van transfers.
 */
export function IslandCoachLogo({ size = 32, className, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect width="32" height="32" rx="8" fill="#F0F7F2" />
      <rect width="32" height="32" rx="8" stroke="#CEE7D6" strokeWidth="1" />
      {/* Island Route / Bus Emblem */}
      <path
        d="M8 12C8 10 9.5 9 16 9C22.5 9 24 10 24 12V19C24 20.5 22.5 21 21 21L21 23H19L19 21H13L13 23H11L11 21C9.5 21 8 20.5 8 19V12Z"
        fill="#1F6F43"
      />
      <rect x="10.5" y="11.5" width="11" height="4" rx="1" fill="#FFFFFF" />
      <circle cx="11.5" cy="18.5" r="1" fill="#FFFFFF" />
      <circle cx="20.5" cy="18.5" r="1" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * Pioneer Insurance
 * Leading medical, travel & baggage insurance underwriter in the Philippines.
 */
export function PioneerInsuranceLogo({ size = 32, className, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect width="32" height="32" rx="8" fill="#EEF8F1" />
      <rect width="32" height="32" rx="8" stroke="#BFE4CB" strokeWidth="1" />
      {/* Shield & Star Protection */}
      <path
        d="M16 7L23 10V16C23 20.5 20 23.5 16 25C12 23.5 9 20.5 9 16V10L16 7Z"
        fill="#006838"
      />
      <path
        d="M16 11L17.2 13.8L20 14.2L17.8 16.1L18.5 19L16 17.5L13.5 19L14.2 16.1L12 14.2L14.8 13.8L16 11Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

/**
 * Malayan Insurance
 * Heritage Philippine non-life insurer. Shield crest and adventure coverage.
 */
export function MalayanInsuranceLogo({ size = 32, className, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect width="32" height="32" rx="8" fill="#FFF2F4" />
      <rect width="32" height="32" rx="8" stroke="#F8B8C4" strokeWidth="1" />
      {/* Malayan Crest "M" */}
      <path
        d="M16 8L23 11V16.5C23 20.5 19.8 23.5 16 24.5C12.2 23.5 9 20.5 9 16.5V11L16 8Z"
        fill="#C41230"
      />
      <path
        d="M12 18V13.5L14.5 16L16 14.5L17.5 16L20 13.5V18"
        stroke="#FFFFFF"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * CarrierLogo
 * Resolves operator name to its official brand emblem with clean fallback.
 */
export function CarrierLogo({
  operator,
  size = 32,
  className,
}: {
  operator: string;
  size?: number;
  className?: string;
}): ReactNode {
  const norm = operator.toLowerCase();

  if (norm.includes('philippine airlines') || norm.includes('pal')) {
    return <PhilippineAirlinesLogo size={size} className={className} />;
  }
  if (norm.includes('cebu pacific') || norm.includes('cebu')) {
    return <CebuPacificLogo size={size} className={className} />;
  }
  if (norm.includes('airasia') || norm.includes('air asia')) {
    return <AirAsiaLogo size={size} className={className} />;
  }
  if (norm.includes('2go')) {
    return <TwoGoTravelLogo size={size} className={className} />;
  }
  if (norm.includes('oceanjet') || norm.includes('ocean jet')) {
    return <OceanJetLogo size={size} className={className} />;
  }
  if (norm.includes('lite ferries') || norm.includes('lite ferry')) {
    return <LiteFerriesLogo size={size} className={className} />;
  }
  if (norm.includes('henry fleet') || norm.includes('henry')) {
    return <HenryFleetLogo size={size} className={className} />;
  }
  if (norm.includes('island coach') || norm.includes('coach')) {
    return <IslandCoachLogo size={size} className={className} />;
  }
  if (norm.includes('pioneer')) {
    return <PioneerInsuranceLogo size={size} className={className} />;
  }
  if (norm.includes('malayan')) {
    return <MalayanInsuranceLogo size={size} className={className} />;
  }

  // Fallback: clean letter avatar badge
  const initial = operator.trim().charAt(0).toUpperCase() || 'T';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="#F4F5F7" />
      <rect width="32" height="32" rx="8" stroke="#DFE1E6" strokeWidth="1" />
      <text
        x="16"
        y="20"
        textAnchor="middle"
        fontSize="13"
        fontWeight="bold"
        fontFamily="sans-serif"
        fill="#462133"
      >
        {initial}
      </text>
    </svg>
  );
}
