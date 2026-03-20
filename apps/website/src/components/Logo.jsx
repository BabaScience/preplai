function EGlyph({ size }) {
  return (
    <svg
      className="logo-e-glyph"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ width: size, height: size, display: 'inline-block', verticalAlign: '-0.1em', margin: '0 -0.5px' }}
    >
      <defs>
        <filter id="fukinsei" x="-18%" y="-18%" width="136%" height="136%"
                colorInterpolationFilters="sRGB">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.018 0.022"
            numOctaves="4"
            seed="7"
            result="noise"/>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="1.8"
            xChannelSelector="R"
            yChannelSelector="G"/>
        </filter>
      </defs>
      <path
        d="M 137.79,38.71 A 72,72 0 1,0 169.97,118.50 L 30.03,115.80"
        fill="none"
        stroke="currentColor"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#fukinsei)"
      />
    </svg>
  );
}

function LogoMark({ size }) {
  return (
    <svg
      className="logo-mark"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ width: size, height: size }}
    >
      <rect width="200" height="200" rx="20" fill="#C9A84C" />
      <defs>
        <filter id="fukinsei-mark" x="-18%" y="-18%" width="136%" height="136%"
                colorInterpolationFilters="sRGB">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.018 0.022"
            numOctaves="4"
            seed="7"
            result="noise"/>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="1.8"
            xChannelSelector="R"
            yChannelSelector="G"/>
        </filter>
      </defs>
      <path
        d="M 137.79,38.71 A 72,72 0 1,0 169.97,118.50 L 30.03,115.80"
        fill="none"
        stroke="#0b0c10"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#fukinsei-mark)"
      />
    </svg>
  );
}

export default function Logo({ size = 28, showWordmark = true }) {
  return (
    <span className="logo" style={{ '--logo-size': `${size}px` }}>
      {showWordmark ? (
        <span className="logo-text" aria-label="preplai">
          pr<EGlyph size="0.7em" />plai
        </span>
      ) : (
        <LogoMark size={size} />
      )}
    </span>
  );
}
