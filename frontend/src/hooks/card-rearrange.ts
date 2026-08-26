import { arrayMove } from '@dnd-kit/sortable';
import type { BoardWithChildren } from './use-boards';

type Lists = BoardWithChildren['lists'];

/**
 * Pure half of the card drag: given the board and what the pointer is
 * over, produce the rearranged lists — or `null` when the move is a
 * no-op or the ids don't resolve.
 *
 * orderIndex is deliberately left untouched. Array order is what
 * renders during the drag; the real fractional index is computed once at
 * drop time from the surviving neighbours.
 */
export function rearrangeForDragOver(
  board: BoardWithChildren,
  activeId: string,
  overId: string,
  overType: string | undefined,
): Lists | null {
  // Source list and the active card's index inside it.
  const sourceListIdx = board.lists.findIndex((l) => l.cards.some((c) => c.id === activeId));
  if (sourceListIdx === -1) return null;
  const sourceList = board.lists[sourceListIdx];
  const activeIdx = sourceList.cards.findIndex((c) => c.id === activeId);

  // Target list + index. Hovering an empty column drops at the end;
  // hovering a card drops just before that card.
  let targetListIdx: number;
  let targetIdx: number;
  if (overType === 'column') {
    targetListIdx = board.lists.findIndex((l) => l.id === overId);
    if (targetListIdx === -1) return null;
    targetIdx = board.lists[targetListIdx].cards.length;
  } else {
    targetListIdx = board.lists.findIndex((l) => l.cards.some((c) => c.id === overId));
    if (targetListIdx === -1) return null;
    targetIdx = board.lists[targetListIdx].cards.findIndex((c) => c.id === overId);
  }

  // Already at this exact slot.
  if (sourceListIdx === targetListIdx && activeIdx === targetIdx) return null;

  return board.lists.map((list, idx) => {
    if (sourceListIdx === targetListIdx && idx === sourceListIdx) {
      return { ...list, cards: arrayMove(list.cards, activeIdx, targetIdx) };
    }
    if (idx === sourceListIdx) {
      return { ...list, cards: list.cards.filter((c) => c.id !== activeId) };
    }
    if (idx === targetListIdx) {
      const movedCard = { ...sourceList.cards[activeIdx], listId: list.id };
      const nextCards = [...list.cards];
      nextCards.splice(targetIdx, 0, movedCard);
      return { ...list, cards: nextCards };
    }
    return list;
  });
}
