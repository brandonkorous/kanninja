import { listBoardsTool } from './list-boards.js';
import { getBoardTool } from './get-board.js';
import { listTasksTool } from './list-tasks.js';
import { getTaskTool } from './get-task.js';
import { getMyWorkTool } from './get-my-work.js';
import { searchTool } from './search.js';
import { createTaskTool } from './create-task.js';
import { updateTaskTool } from './update-task.js';
import { moveTaskTool } from './move-task.js';
import { deleteTaskTool } from './delete-task.js';
import { addCommentTool } from './add-comment.js';
import { listCommentsTool } from './list-comments.js';
import { updateCommentTool } from './update-comment.js';
import { deleteCommentTool } from './delete-comment.js';
import { assignTaskTool } from './assign-task.js';
import { addLabelTool } from './add-label.js';
import { removeLabelTool } from './remove-label.js';
import { listLabelsTool } from './list-labels.js';
import { createLabelTool } from './create-label.js';
import { updateLabelTool } from './update-label.js';
import { deleteLabelTool } from './delete-label.js';
import { setDueDateTool } from './set-due-date.js';
import { createBoardTool } from './create-board.js';
import { updateBoardTool } from './update-board.js';
import { deleteBoardTool } from './delete-board.js';
import { createListTool } from './create-list.js';
import { updateListTool } from './update-list.js';
import { deleteListTool } from './delete-list.js';
import { reorderListsTool } from './reorder-lists.js';
import { listChecklistTool } from './list-checklist.js';
import { addChecklistItemTool } from './add-checklist-item.js';
import { updateChecklistItemTool } from './update-checklist-item.js';
import { deleteChecklistItemTool } from './delete-checklist-item.js';
import { listConnectedIntegrationsTool } from './list-connected-integrations.js';
import { listAvailableProvidersTool } from './list-available-providers.js';
import { getIntegrationEventsTool } from './get-integration-events.js';
import { syncIntegrationTool } from './sync-integration.js';
import { createBoardWithStructureTool } from './create-board-with-structure.js';
import { applyTemplateToBoardTool } from './apply-template-to-board.js';
import { bulkCreateTasksTool } from './bulk-create-tasks.js';
import { bulkUpdateTasksTool } from './bulk-update-tasks.js';
import { duplicateCardTool } from './duplicate-card.js';
import type { ToolDefinition } from '../registry.js';

export const allTools: ToolDefinition[] = [
  // Read
  listBoardsTool,
  getBoardTool,
  listTasksTool,
  getTaskTool,
  getMyWorkTool,
  searchTool,
  listCommentsTool,
  listChecklistTool,
  listLabelsTool,
  // Boards
  createBoardTool,
  updateBoardTool,
  deleteBoardTool,
  // Lists
  createListTool,
  updateListTool,
  deleteListTool,
  reorderListsTool,
  // Cards
  createTaskTool,
  updateTaskTool,
  moveTaskTool,
  deleteTaskTool,
  assignTaskTool,
  setDueDateTool,
  // Comments
  addCommentTool,
  updateCommentTool,
  deleteCommentTool,
  // Checklist
  addChecklistItemTool,
  updateChecklistItemTool,
  deleteChecklistItemTool,
  // Labels
  createLabelTool,
  updateLabelTool,
  deleteLabelTool,
  addLabelTool,
  removeLabelTool,
  // Composite (transactional, multi-resource — one call replaces a chain of CRUD)
  createBoardWithStructureTool,
  applyTemplateToBoardTool,
  bulkCreateTasksTool,
  bulkUpdateTasksTool,
  duplicateCardTool,
  // Integrations
  listConnectedIntegrationsTool,
  listAvailableProvidersTool,
  getIntegrationEventsTool,
  syncIntegrationTool,
];
