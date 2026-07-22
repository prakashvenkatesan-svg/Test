const splitAddress = (address) => {
  const normalized = String(address || "")
    .split(/\r?\n|,/)
    .map((part) => part.trim())
    .filter(Boolean);

  let line1 = normalized.slice(0, 2).join(", ");
  let line2 = normalized.slice(2).join(", ");

  const MAX_LINE_LENGTH = 55;
  if (line1.length > MAX_LINE_LENGTH) {
    const fullAddress = String(address || "").replace(/\s+/g, " ").trim();
    
    let breakPoint = fullAddress.lastIndexOf(" ", MAX_LINE_LENGTH);
    if (breakPoint === -1) {
      breakPoint = fullAddress.lastIndexOf(",", MAX_LINE_LENGTH);
    }
    if (breakPoint === -1) {
      breakPoint = MAX_LINE_LENGTH;
    }
    
    line1 = fullAddress.substring(0, breakPoint).trim();
    let remaining = fullAddress.substring(breakPoint).trim();
    if (remaining.startsWith(",")) {
      remaining = remaining.substring(1).trim();
    }
    line2 = remaining;
  }

  return { line1, line2 };
};

const address = "DNO 139 B KOTTUR KRISHNAGIRI TALUK B KOTTOR POST RAGIMANAPALLI KRISHNAGIRI TAMIL NADU 635121";
console.log(splitAddress(address));
