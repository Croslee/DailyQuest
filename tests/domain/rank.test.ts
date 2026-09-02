import { describe, it, expect } from 'vitest';
import { getRankForLevel, checkRankPromotion, SHADOW_SLAVE_RANKS } from '@/domain/rank';

describe('Shadow Slave Rank Domain', () => {
  it('should map levels to correct ranks according to exponential scale', () => {
    expect(getRankForLevel(1).id).toBe('dormant');
    expect(getRankForLevel(9).id).toBe('dormant');
    expect(getRankForLevel(10).id).toBe('awakened');
    expect(getRankForLevel(24).id).toBe('awakened');
    expect(getRankForLevel(25).id).toBe('ascended');
    expect(getRankForLevel(49).id).toBe('ascended');
    expect(getRankForLevel(50).id).toBe('transcended');
    expect(getRankForLevel(99).id).toBe('transcended');
    expect(getRankForLevel(100).id).toBe('supreme');
    expect(getRankForLevel(199).id).toBe('supreme');
    expect(getRankForLevel(200).id).toBe('sacred');
    expect(getRankForLevel(399).id).toBe('sacred');
    expect(getRankForLevel(400).id).toBe('divine');
    expect(getRankForLevel(1000).id).toBe('divine');
  });

  it('should detect rank promotions correctly', () => {
    const p1 = checkRankPromotion(9, 10);
    expect(p1.promoted).toBe(true);
    expect(p1.oldRank.id).toBe('dormant');
    expect(p1.newRank.id).toBe('awakened');

    const p2 = checkRankPromotion(10, 11);
    expect(p2.promoted).toBe(false);

    const p3 = checkRankPromotion(24, 25);
    expect(p3.promoted).toBe(true);
    expect(p3.newRank.id).toBe('ascended');

    const p4 = checkRankPromotion(49, 50);
    expect(p4.promoted).toBe(true);
    expect(p4.newRank.id).toBe('transcended');

    const p5 = checkRankPromotion(99, 100);
    expect(p5.promoted).toBe(true);
    expect(p5.newRank.id).toBe('supreme');
  });

  it('should have all 7 progression ranks defined in order', () => {
    expect(SHADOW_SLAVE_RANKS).toHaveLength(7);
    expect(SHADOW_SLAVE_RANKS.map(r => r.id)).toEqual([
      'dormant',
      'awakened',
      'ascended',
      'transcended',
      'supreme',
      'sacred',
      'divine',
    ]);
  });
});
