/**
 * La bulle : il reste un joueur de plus que de places payées.
 * Le prochain éliminé repart sans rien ; ensuite, tout le monde est payé (« dans l'argent »).
 */
export type BubbleState = 'before' | 'bubble' | 'itm';

export function bubbleState(activeCount: number, paidPlaces: number): BubbleState {
  // Une seule place payée : à deux joueurs c'est la finale, pas une bulle
  if (paidPlaces < 2) return 'before';
  if (activeCount <= paidPlaces) return 'itm';
  if (activeCount === paidPlaces + 1) return 'bubble';
  return 'before';
}

/** La bulle vient d'éclater : on passe de « bulle » à « dans l'argent ». */
export function bubbleBurst(previous: BubbleState, current: BubbleState): boolean {
  return previous === 'bubble' && current === 'itm';
}
