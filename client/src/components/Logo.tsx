interface LogoProps {
  className?: string;
  white?: boolean;
}

export function Logo({ className = "h-8", white = false }: LogoProps) {
  if (white) {
    return (
      <svg 
        className={className} 
        viewBox="0 0 380 120" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ícone do caderno/notepad - branco */}
        <rect 
          x="10" 
          y="20" 
          width="80" 
          height="80" 
          rx="16" 
          fill="#FFFFFF"
        />
        
        {/* Linhas do notepad - azul escuro para contraste */}
        <line x1="30" y1="45" x2="50" y2="45" stroke="#005CA9" strokeWidth="4" strokeLinecap="round"/>
        <line x1="30" y1="60" x2="60" y2="60" stroke="#005CA9" strokeWidth="4" strokeLinecap="round"/>
        <line x1="30" y1="75" x2="55" y2="75" stroke="#005CA9" strokeWidth="4" strokeLinecap="round"/>
        
        {/* Círculo - branco com borda */}
        <circle cx="65" cy="45" r="10" fill="#FFFFFF" stroke="#005CA9" strokeWidth="2"/>
        
        {/* Texto AnotaTudo - branco */}
        <text 
          x="110" 
          y="75" 
          fill="#FFFFFF"
          style={{ fontSize: '36px', fontWeight: 'bold', fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-1.5px' }}
        >
          AnotaTudo
        </text>
      </svg>
    );
  }

  return (
    <svg 
      className={className} 
      viewBox="0 0 380 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ícone do caderno/notepad */}
      <rect 
        x="10" 
        y="20" 
        width="80" 
        height="80" 
        rx="16" 
        className="fill-[#003d5c] dark:fill-[#0ea5e9]"
      />
      
      {/* Linhas do notepad */}
      <line x1="30" y1="45" x2="50" y2="45" className="stroke-white dark:stroke-slate-900" strokeWidth="4" strokeLinecap="round"/>
      <line x1="30" y1="60" x2="60" y2="60" className="stroke-white dark:stroke-slate-900" strokeWidth="4" strokeLinecap="round"/>
      <line x1="30" y1="75" x2="55" y2="75" className="stroke-white dark:stroke-slate-900" strokeWidth="4" strokeLinecap="round"/>
      
      {/* Círculo verde */}
      <circle cx="65" cy="45" r="10" className="fill-[#10b981]"/>
      
      {/* Texto AnotaTudo.AI */}
      <text 
        x="110" 
        y="75" 
        className="fill-[#1e3a5f] dark:fill-slate-100"
        style={{ fontSize: '36px', fontWeight: 'bold', fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-1.5px' }}
      >
        AnotaTudo<tspan className="fill-[#10b981]">.AI</tspan>
      </text>
    </svg>
  );
}
