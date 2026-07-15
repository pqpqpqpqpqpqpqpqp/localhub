export const CATEGORIES = [
  { code: 'HS030100', name: '사찰', baseQuiet: 5, emoji: '🛕' },
  { code: 'VE090300', name: '도서관', baseQuiet: 5, emoji: '📚' },
  { code: 'LS011900', name: '둘레길/숲길', baseQuiet: 5, emoji: '🌲' },
  { code: 'VE070600', name: '미술관/갤러리', baseQuiet: 4, emoji: '🖼️' },
  { code: 'VE070100', name: '박물관', baseQuiet: 4, emoji: '🏛️' },
  { code: 'VE030500', name: '호수/근린공원', baseQuiet: 3, emoji: '🦆' },
  { code: 'VE030100', name: '공원/자연', baseQuiet: 3, emoji: '🌳' }
];

export function quietColor(score) {
  const s = Number(score);
  if (Number.isNaN(s)) return '#B0B0B0';
  if (s >= 4.5) return '#0B6E6E';
  if (s >= 3.5) return '#3AA6A6';
  if (s >= 2.5) return '#8FB8B8';
  return '#B0B0B0';
}

export function quietLabel(score) {
  const s = Number(score);
  if (Number.isNaN(s)) return '생각보다 시끄러움';
  if (s >= 4.5) return '아주 조용';
  if (s >= 3.5) return '조용';
  if (s >= 2.5) return '보통';
  return '생각보다 시끄러움';
}