import { listBoardsTool } from './list-boards.js';
import { getBoardTool } from './get-board.js';
import { listTasksTool } from './list-tasks.js';
import { getTaskTool } from './get-task.js';
import { getMyWorkTool } from './get-my-work.js';
import { searchTool } from './search.js';
import { createTaskTool } from './create-task.js';
import { updateTaskTool } from './update-task.js';
import { moveTaskTool } from './move-task.js';
import { addCommentTool } from './add-comment.js';
import { assignTaskTool } from './assign-task.js';
import { addLabelTool } from './add-label.js';
import { removeLabelTool } from './remove-label.js';
import { setDueDateTool } from './set-due-date.js';
import { createBoardTool } from './create-board.js';
import type { ToolDefinition } from '../registry.js';

export const allTools: ToolDefinition[] = [
  // Read
  listBoardsTool,
  getBoardTool,
  listTasksTool,
  getTaskTool,
  getMyWorkTool,
  searchTool,
  // Write
  createTaskTool,
  updateTaskTool,
  moveTaskTool,
  addCommentTool,
  assignTaskTool,
  addLabelTool,
  removeLabelTool,
  setDueDateTool,
  createBoardTool,
];
