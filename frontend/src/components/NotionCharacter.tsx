import React from 'react';

export interface NotionCharacterProps {
  type: 'female-young' | 'male-adult' | 'female-teen' | 'male-middle' | 'female-teen-2' | 'male-stressed';
  size?: number;
  className?: string;
}

export const NotionCharacter: React.FC<NotionCharacterProps> = ({ 
  type, 
  size = 80, 
  className = '' 
}) => {
  const strokeWidth = size > 40 ? 1.5 : 1.2;
  
  const renderCharacter = () => {
    switch (type) {
      case 'female-young':
        return (
          <svg width={size} height={size} viewBox="0 0 80 80" className={`notion-character ${className}`}>
            {/* Head */}
            <circle cx="40" cy="28" r="12" />
            {/* Hair */}
            <path d="M28 20 C28 14, 34 14, 40 14 C46 14, 52 14, 52 20 C52 16, 48 18, 44 18 C42 16, 38 16, 36 18 C32 18, 28 16, 28 20 Z" />
            {/* Eyes */}
            <circle cx="36" cy="26" r="1.5" fill="currentColor" />
            <circle cx="44" cy="26" r="1.5" fill="currentColor" />
            {/* Smile */}
            <path d="M36 32 Q40 34, 44 32" />
            {/* Body */}
            <line x1="40" y1="40" x2="40" y2="60" />
            {/* Arms */}
            <path d="M40 46 L32 50 L30 54" />
            <path d="M40 46 L48 50 L50 54" />
            {/* Legs */}
            <line x1="40" y1="60" x2="34" y2="72" />
            <line x1="40" y1="60" x2="46" y2="72" />
            {/* Dress/Skirt */}
            <path d="M35 50 L40 58 L45 50" />
          </svg>
        );
        
      case 'male-adult':
        return (
          <svg width={size} height={size} viewBox="0 0 80 80" className={`notion-character ${className}`}>
            {/* Head */}
            <circle cx="40" cy="28" r="12" />
            {/* Hair */}
            <path d="M30 18 C34 15, 40 15, 46 15 C50 15, 52 18, 52 22 C50 16, 45 16, 40 18 C35 16, 30 16, 30 18 Z" />
            {/* Eyes */}
            <circle cx="36" cy="26" r="1.5" fill="currentColor" />
            <circle cx="44" cy="26" r="1.5" fill="currentColor" />
            {/* Mouth */}
            <line x1="38" y1="32" x2="42" y2="32" />
            {/* Body */}
            <rect x="35" y="40" width="10" height="20" rx="2" />
            {/* Arms */}
            <line x1="35" y1="45" x2="28" y2="52" />
            <line x1="45" y1="45" x2="52" y2="52" />
            {/* Legs */}
            <line x1="38" y1="60" x2="35" y2="72" />
            <line x1="42" y1="60" x2="45" y2="72" />
            {/* Tie */}
            <line x1="40" y1="40" x2="40" y2="50" />
            <path d="M38 42 L40 40 L42 42 L40 46 Z" />
          </svg>
        );
        
      case 'female-teen':
        return (
          <svg width={size} height={size} viewBox="0 0 80 80" className={`notion-character ${className}`}>
            {/* Head */}
            <circle cx="40" cy="28" r="11" />
            {/* Hair - ponytails */}
            <circle cx="28" cy="22" r="3" />
            <circle cx="52" cy="22" r="3" />
            <path d="M32 18 C36 16, 40 16, 44 16 C48 16, 48 20, 48 22" />
            <path d="M32 18 C32 20, 32 22, 32 22" />
            {/* Eyes */}
            <circle cx="36" cy="26" r="1.5" fill="currentColor" />
            <circle cx="44" cy="26" r="1.5" fill="currentColor" />
            {/* Smile */}
            <path d="M36 31 Q40 33, 44 31" />
            {/* Body */}
            <line x1="40" y1="39" x2="40" y2="58" />
            {/* Arms */}
            <path d="M40 44 L33 48 L31 52" />
            <path d="M40 44 L47 48 L49 52" />
            {/* Legs */}
            <line x1="40" y1="58" x2="35" y2="70" />
            <line x1="40" y1="58" x2="45" y2="70" />
            {/* School uniform */}
            <path d="M36 42 L40 44 L44 42 L44 54 L36 54 Z" />
          </svg>
        );
        
      case 'male-middle':
        return (
          <svg width={size} height={size} viewBox="0 0 80 80" className={`notion-character ${className}`}>
            {/* Head */}
            <circle cx="40" cy="28" r="12" />
            {/* Balding hair */}
            <path d="M32 18 C35 16, 40 16, 45 16 C48 16, 50 18, 50 22" />
            <path d="M30 20 C30 22, 32 22, 32 20" />
            {/* Eyes with glasses */}
            <circle cx="40" cy="26" r="8" />
            <circle cx="36" cy="26" r="4" />
            <circle cx="44" cy="26" r="4" />
            <circle cx="36" cy="26" r="1.5" fill="currentColor" />
            <circle cx="44" cy="26" r="1.5" fill="currentColor" />
            <line x1="32" y1="26" x2="28" y2="24" />
            <line x1="48" y1="26" x2="52" y2="24" />
            {/* Tired expression */}
            <path d="M37 32 Q40 30, 43 32" />
            {/* Body - suit */}
            <rect x="34" y="40" width="12" height="22" rx="2" />
            {/* Arms */}
            <line x1="34" y1="46" x2="26" y2="54" />
            <line x1="46" y1="46" x2="54" y2="54" />
            {/* Legs */}
            <line x1="37" y1="62" x2="34" y2="74" />
            <line x1="43" y1="62" x2="46" y2="74" />
            {/* Shirt and tie */}
            <line x1="40" y1="40" x2="40" y2="55" />
            <polygon points="38,42 40,40 42,42 40,48" />
          </svg>
        );
        
      case 'female-teen-2':
        return (
          <svg width={size} height={size} viewBox="0 0 80 80" className={`notion-character ${className}`}>
            {/* Head */}
            <circle cx="40" cy="28" r="11" />
            {/* Hair - short bob */}
            <path d="M28 20 C28 15, 34 14, 40 14 C46 14, 52 15, 52 20 C52 24, 48 26, 44 26 C42 24, 38 24, 36 26 C32 26, 28 24, 28 20 Z" />
            {/* Eyes - sad */}
            <path d="M34 24 L38 26" />
            <path d="M42 26 L46 24" />
            <circle cx="36" cy="26" r="1" fill="currentColor" />
            <circle cx="44" cy="26" r="1" fill="currentColor" />
            {/* Sad mouth */}
            <path d="M36 33 Q40 31, 44 33" />
            {/* Body */}
            <line x1="40" y1="39" x2="40" y2="58" />
            {/* Arms - crossed */}
            <path d="M40 44 L32 48" />
            <path d="M40 44 L48 48" />
            <path d="M32 48 L38 52" />
            <path d="M48 48 L42 52" />
            {/* Legs */}
            <line x1="40" y1="58" x2="36" y2="70" />
            <line x1="40" y1="58" x2="44" y2="70" />
            {/* Hoodie */}
            <path d="M35 40 L40 42 L45 40 L45 56 L35 56 Z" />
            <circle cx="40" cy="46" r="6" />
          </svg>
        );
        
      case 'male-stressed':
        return (
          <svg width={size} height={size} viewBox="0 0 80 80" className={`notion-character ${className}`}>
            {/* Head */}
            <circle cx="40" cy="28" r="12" />
            {/* Messy hair */}
            <path d="M30 18 L32 15 L35 17 L38 14 L40 16 L42 14 L45 17 L48 15 L50 18" />
            <path d="M28 20 C30 18, 32 20, 34 18 C36 20, 38 18, 40 20 C42 18, 44 20, 46 18 C48 20, 50 18, 52 20" />
            {/* Tired eyes */}
            <line x1="34" y1="24" x2="38" y2="26" />
            <line x1="42" y1="26" x2="46" y2="24" />
            <circle cx="36" cy="26" r="1" fill="currentColor" />
            <circle cx="44" cy="26" r="1" fill="currentColor" />
            {/* Stressed expression */}
            <path d="M37 32 Q40 34, 43 32" />
            {/* Body - wrinkled shirt */}
            <path d="M35 40 L45 40 L46 60 L34 60 Z" />
            <line x1="37" y1="44" x2="43" y2="44" />
            <line x1="36" y1="48" x2="44" y2="48" />
            <line x1="37" y1="52" x2="43" y2="52" />
            {/* Arms - tired posture */}
            <path d="M35 45 L28 52 L26 56" />
            <path d="M45 45 L52 52 L54 56" />
            {/* Legs */}
            <line x1="37" y1="60" x2="34" y2="72" />
            <line x1="43" y1="60" x2="46" y2="72" />
            {/* Stress lines */}
            <line x1="26" y1="22" x2="28" y2="20" />
            <line x1="52" y1="20" x2="54" y2="22" />
            <line x1="28" y1="18" x2="30" y2="16" />
          </svg>
        );
        
      default:
        return (
          <svg width={size} height={size} viewBox="0 0 80 80" className={`notion-character ${className}`}>
            <circle cx="40" cy="40" r="20" />
            <circle cx="36" cy="36" r="2" fill="currentColor" />
            <circle cx="44" cy="36" r="2" fill="currentColor" />
            <path d="M35 45 Q40 48, 45 45" />
          </svg>
        );
    }
  };

  return (
    <div className={`notion-avatar ${className}`} style={{ width: size, height: size }}>
      {renderCharacter()}
    </div>
  );
};