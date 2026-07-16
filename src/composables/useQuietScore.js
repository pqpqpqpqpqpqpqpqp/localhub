/**
 * [비즈니스 로직] 조용함 지수 계산 알고리즘
 * - 장소 카테고리별 기본 점수 부여
 * - 사용자 리뷰 개수 등을 조합해 '조용함 점수' 산출
 */
export function computeQuiet(place, postsForPlace = []) {
  const base = typeof place.baseQuiet === 'number'
    ? place.baseQuiet
    : Number(place.baseQuiet) || 0;

  // 별점이 명시된 게시글만 반영
  const rated = (postsForPlace || []).filter(p => {
    return p != null && (typeof p.quietScore === 'number' || (p.quietScore !== null && !isNaN(Number(p.quietScore))));
  }).map(p => Number(p.quietScore));

  const reviewCount = rated.length;
  if (reviewCount === 0) {
    return { finalQuiet: Math.round(base * 10) / 10, reviewCount: 0 };
  }

  const sumScores = rated.reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0);
  const raw = (base + sumScores) / (1 + reviewCount);
  return { finalQuiet: Math.round(raw * 10) / 10, reviewCount };
}

export function enrichPlaces(places = [], allPosts = []) {
  const map = new Map();
  for (const post of allPosts) {
    const cid = String(post.contentid ?? post.contentId ?? '');
    if (!map.has(cid)) map.set(cid, []);
    map.get(cid).push(post);
  }

  return (places || []).map(place => {
    const postsForPlace = map.get(String(place.contentid ?? '')) || [];
    const { finalQuiet, reviewCount } = computeQuiet(place, postsForPlace);
    return { ...place, finalQuiet, reviewCount };
  });
}
