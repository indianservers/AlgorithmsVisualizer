export function Penguin({ height, status }: { height: number; status: string }) {
  return (
    <svg preserveAspectRatio="none" viewBox="0 0 100 200" width={height / 2} height={height} className={`penguin-art ${status}`} aria-hidden="true">
      <ellipse cx="50" cy="191" rx="35" ry="6" fill="#152c46" opacity=".14" />
      <path className="penguin-wing left" d="M26 73 Q4 105 8 145 Q11 156 18 137 L30 108" fill="#173956" stroke="#0e253e" strokeWidth="3" />
      <path className="penguin-wing right" d="M74 73 Q96 105 92 145 Q89 156 82 137 L70 108" fill="#173956" stroke="#0e253e" strokeWidth="3" />
      <path d="M48 14 Q38 0 41 20 Q48 6 54 19 Q64 5 59 24" fill="#102b45" />
      <path
        d="M50 19 C20 19 19 52 22 76 C12 112 17 163 31 181 Q50 195 69 181 C83 163 88 112 78 76 C81 52 80 19 50 19"
        fill="#153750"
        stroke="#0c2239"
        strokeWidth="3"
      />
      <path d="M23 78 C25 35 44 34 50 59 C56 34 75 35 77 78 Q68 89 77 121 C85 177 61 189 50 186 C39 189 15 177 23 121 Q32 89 23 78" fill="#f7fafb" />
      <ellipse cx="37" cy="63" rx="8" ry="13" fill="#fff" />
      <ellipse cx="63" cy="63" rx="8" ry="13" fill="#fff" />
      <ellipse cx="39" cy="66" rx="4" ry="7" fill="#102238" />
      <ellipse cx="61" cy="66" rx="4" ry="7" fill="#102238" />
      <circle cx="40" cy="63" r="1.8" fill="white" />
      <circle cx="62" cy="63" r="1.8" fill="white" />
      <path d="M40 83 Q50 73 60 83 L50 91 Z" fill="#ffad2e" stroke="#d47710" strokeWidth="1.5" />
      <ellipse cx="33" cy="187" rx="16" ry="6" fill="#ffac27" />
      <ellipse cx="67" cy="187" rx="16" ry="6" fill="#ffac27" />
      <path d="M31 102 Q22 143 33 168" fill="none" stroke="white" opacity=".65" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

export function Dolphin({ height, status }: { height: number; status: string }) {
  return (
    <svg preserveAspectRatio="none" viewBox="0 0 100 200" width={height / 2} height={height} className={`penguin-art dolphin-art ${status}`} aria-hidden="true">
      <path d="M32 155C8 161 6 181 9 191l23-15c7 9 17 13 27 12l-11-23" fill="#318eb9" stroke="#155b88" strokeWidth="2" />
      <path
        d="M36 133C13 113 18 71 39 46l4-26 20 13c12-3 20 0 25 8l10 7-17 9c-1 30-31 48-37 79l-3 36-13-10Z"
        fill="#58bce0"
        stroke="#155b88"
        strokeWidth="2.5"
      />
      <path d="M73 57C67 91 39 114 36 151l7-16c6-31 37-49 38-78" fill="#d2f4ff" />
      <path d="M45 83C19 85 9 104 9 116c17-1 28-10 38-20" fill="#318eb9" stroke="#155b88" strokeWidth="2" />
      <circle cx="76" cy="42" r="3" fill="#123c59" />
      <circle cx="77" cy="41" r="1" fill="white" />
      <path d="M80 53q7 2 12-4" fill="none" stroke="#155b88" strokeWidth="2" strokeLinecap="round" />
      <path d="M44 48q-18 26-15 47" fill="none" stroke="white" strokeOpacity=".5" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
