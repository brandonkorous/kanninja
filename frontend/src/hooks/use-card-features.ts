// Re-export facade for the split card-features hooks. Keeps the public
// import path stable (`@/hooks/use-card-features`) while the actual hooks
// live in per-feature files under card-features/ — each under the 200-line
// cap and organized by concern.
//
// Feature files:
//   use-comments.ts      · notes on a card
//   use-checklist.ts     · subtasks
//   use-labels.ts        · board + card labels
//   use-time-entries.ts  · timer start/stop + history
//   use-attachments.ts   · file upload/delete via signed URLs

export * from './card-features/use-comments';
export * from './card-features/use-checklist';
export * from './card-features/use-labels';
export * from './card-features/use-time-entries';
export * from './card-features/use-attachments';
