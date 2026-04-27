import { openai } from '../config/openai.js';
import { db } from '../db/index.js';
import { aiInteractions } from '../db/schema/analytics.js';
import { boards } from '../db/schema/boards.js';
import { lists } from '../db/schema/lists.js';
import { cards } from '../db/schema/cards.js';
import { eq } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';
import { getIntegrationContext, getCalendarEvents } from '../integrations/ai-context.js';

const MODEL = 'gpt-4o-mini';

async function logInteraction(userId: string, query: string, responseType: string, context?: Record<string, unknown>) {
  await db.insert(aiInteractions).values({
    userId,
    query: query.slice(0, 5000),
    responseType,
    context: context ?? null,
  });
}

// The model is bad at date arithmetic but great at lookups. So instead of
// asking it to compute "what date is Thursday from today", we hand it a
// 14-day weekday-to-date table and tell it to look up. Used by every method
// that resolves user-supplied relative dates.
function buildDateScaffold(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const base = Date.UTC(y, m, d);
  const DAY = 86400000;

  const fmt = (ms: number) => new Date(ms).toISOString().split('T')[0];
  const weekday = (ms: number) =>
    new Date(ms).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });

  const todayDow = new Date(base).getUTCDay();
  const daysToFri = (5 - todayDow + 7) % 7 || 7; // if today IS Friday, "this Friday" means a week out
  const thisFri = base + daysToFri * DAY;
  const nextFri = thisFri + 7 * DAY;
  const eom = Date.UTC(y, m + 1, 0);
  const eonm = Date.UTC(y, m + 2, 0);

  const lines: string[] = [`Today is ${weekday(base)}, ${fmt(base)}.`, ''];
  lines.push('Reference dates (look up; do not compute):');
  for (let i = 0; i <= 13; i += 1) {
    const ms = base + i * DAY;
    const name = weekday(ms);
    let label: string;
    if (i === 0) label = `Today (${name})`;
    else if (i === 1) label = `Tomorrow (${name})`;
    else if (i <= 6) label = `This ${name}`;
    else label = `Next ${name}`;
    lines.push(`- ${label}: ${fmt(ms)}`);
  }
  lines.push('');
  lines.push(`End of this week (Friday): ${fmt(thisFri)}`);
  lines.push(`End of next week (Friday): ${fmt(nextFri)}`);
  lines.push(`End of this month: ${fmt(eom)}`);
  lines.push(`End of next month: ${fmt(eonm)}`);
  lines.push('');
  lines.push('Date resolution rules:');
  lines.push('- "<weekday>" or "by <weekday>" → use the "This <weekday>" entry.');
  lines.push('- "next <weekday>" → use the "Next <weekday>" entry.');
  lines.push('- "tomorrow" → Tomorrow\'s date.');
  lines.push('- "EOW" or "end of week" → End of this week.');
  lines.push('- "EOM" or "end of month" → End of this month.');
  lines.push('- Always look up the date from the list above. Never compute or guess.');
  return lines.join('\n');
}

async function callJSON<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new AppError('INTERNAL_ERROR', 'Empty AI response', 500);

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new AppError('INTERNAL_ERROR', 'Failed to parse AI response', 500);
  }
}

export const aiService = {
  // === Phase 1: Task intelligence ===

  async parseTask(userId: string, text: string) {
    const systemPrompt = [
      'You are a task parser. Extract structured task data from natural language.',
      buildDateScaffold(),
      'Respond with JSON containing: title (required), description, priority (low/medium/high/urgent), due_date (YYYY-MM-DD; look up from the reference table — do not compute), estimated_hours, tags (array), subtasks (array of titles).',
    ].join('\n\n');
    const result = await callJSON<{
      title: string;
      description?: string;
      priority?: string;
      due_date?: string;
      estimated_hours?: number;
      tags?: string[];
      subtasks?: string[];
    }>(systemPrompt, text);
    await logInteraction(userId, text, 'task_parse');
    return result;
  },

  async getSuggestions(userId: string, taskTitle: string, type: 'subtasks' | 'priority' | 'optimization') {
    const prompts: Record<string, string> = {
      subtasks: 'Generate 3-5 specific subtask titles for this task. Respond with JSON: {"subtasks": [...]}',
      priority: 'Suggest a priority level (low/medium/high/urgent) and explain why. Respond with JSON: {"priority": "...", "reason": "..."}',
      optimization: 'Suggest optimizations for completing this task efficiently. Respond with JSON: {"suggestions": [...]}',
    };

    const result = await callJSON(prompts[type], taskTitle);
    await logInteraction(userId, taskTitle, `suggestion_${type}`);
    return result;
  },

  async generateTemplate(userId: string, templateType: string, customRequest?: string) {
    const result = await callJSON<{
      board_title: string;
      board_description: string;
      lists: Array<{ title: string; cards: Array<{ title: string; description?: string; priority?: string }> }>;
    }>(
      `You are a project template generator. Create a complete kanban board template for "${templateType}". Respond with JSON: {board_title, board_description, lists: [{title, cards: [{title, description, priority}]}]}. Include 3-5 lists with 2-5 cards each. Priority MUST be lowercase and exactly one of: "low", "medium", "high", "urgent" — never capitalized, never any other value. Omit the priority field rather than guess.`,
      customRequest ?? `Standard ${templateType} template`,
    );
    await logInteraction(userId, templateType, 'template_generate', { customRequest });
    return result;
  },

  // === Phase 2: Execution & automation ===

  async smartStartDate(
    userId: string,
    input: { title: string; description?: string; dueDate: string; estimatedHours?: number },
  ) {
    // Calendar-aware start date suggestion. The naive answer is
    // dueDate - estimatedHours, which the frontend can compute itself
    // for free. This endpoint exists for the smarter case: factoring
    // in the user's calendar so we don't suggest a start day they're
    // already booked solid, plus a buffer for risk on complex tasks.
    const calendarEvents = await getCalendarEvents(userId).catch(() => []);

    const context = {
      ...input,
      today: new Date().toISOString().split('T')[0],
      ...(calendarEvents?.length && { upcomingCalendarEvents: calendarEvents.slice(0, 15) }),
    };

    const systemPrompt = [
      'Analyze this task and suggest a realistic start date that gives the user enough working time to complete it before the due date.',
      'The naive answer is dueDate - estimatedHours; improve on it by adding buffer for complex tasks and avoiding days the user is heavily booked.',
      calendarEvents?.length
        ? 'Calendar events are provided — avoid start dates where the first working day would land on a heavy-meeting day.'
        : '',
      'Respond with JSON: {suggested_start_date (ISO date), working_days_needed, buffer_days, reasoning}.',
    ]
      .filter(Boolean)
      .join(' ');

    const result = await callJSON<{
      suggested_start_date: string;
      working_days_needed: number;
      buffer_days: number;
      reasoning: string;
    }>(systemPrompt, JSON.stringify(context));
    await logInteraction(userId, input.title, 'smart_start_date');
    return result;
  },

  async reviewCard(
    userId: string,
    input: { title: string; description: string | null; priority: string; estimatedHours: number | null },
  ) {
    // Holistic card review for the "Review with AI" panel on the card
    // detail modal. Only proposes a change when the current value is
    // materially worse than what the model would write — silence is
    // the right answer for fields that are already fine. Title is
    // intentionally out of scope: it's the user's voice and surprise-
    // renaming feels invasive.
    const systemPrompt = [
      'Review this kata and propose improvements ONLY where the current value is materially worse than what you would write.',
      'Stay silent on fields that are already fine — do not suggest stylistic micro-edits or rephrasings of existing text.',
      'Eligible fields: description, priority, estimatedHours. Title is out of scope; never propose a title change.',
      'For description: if missing, write 2–3 sentences clarifying purpose and scope; if present and weak, propose a clearer version. Skip if already clear.',
      'For priority: propose only when current is "none" and the kata has clear urgency signals, OR current strongly mismatches the apparent stakes.',
      'For estimatedHours: propose only when missing or wildly off; round to 0.5h increments.',
      'Each proposal includes a one-sentence reasoning grounded in what the user already wrote — not generic project-management advice.',
      'Respond with JSON: {suggestions: {description?: {proposed: string, reasoning: string}, priority?: {proposed: "low"|"medium"|"high"|"urgent", reasoning: string}, estimatedHours?: {proposed: number, reasoning: string}}}.',
      'Only include keys for fields you are actually suggesting a change to. Empty {suggestions: {}} is valid and expected for solid kata.',
    ].join(' ');

    const result = await callJSON<{
      suggestions: {
        description?: { proposed: string; reasoning: string };
        priority?: { proposed: 'low' | 'medium' | 'high' | 'urgent'; reasoning: string };
        estimatedHours?: { proposed: number; reasoning: string };
      };
    }>(systemPrompt, JSON.stringify(input));
    await logInteraction(userId, input.title, 'card_review');
    return result;
  },

  async generateChecklist(
    userId: string,
    input: { title: string; description?: string; priority?: string; estimatedHours?: number },
  ) {
    // Inline assist on the card-detail Checklist tab. Used only when the
    // list is empty, so the prompt is tuned to "break a kata into steps"
    // rather than to expand on existing items. Steps are short imperatives
    // (5–8 words) so they read like a real checklist, not a description.
    const systemPrompt = [
      'Break this kata into 3–7 concrete, actionable steps a person can check off as they work.',
      'Each step is a short imperative (5–8 words), starts with a verb, and represents real progress — not a status update.',
      'Order the steps roughly chronologically. Skip generic filler like "plan the work" or "review when done".',
      'Respond with JSON: {steps: string[]}.',
    ].join(' ');

    const result = await callJSON<{ steps: string[] }>(systemPrompt, JSON.stringify(input));
    await logInteraction(userId, input.title, 'checklist_generate');
    return result;
  },

  async smartDueDate(userId: string, input: { title: string; description?: string; estimatedHours?: number }) {
    // Fetch calendar events to avoid scheduling conflicts
    const calendarEvents = await getCalendarEvents(userId).catch(() => []);

    const context = {
      ...input,
      today: new Date().toISOString().split('T')[0],
      ...(calendarEvents?.length && { upcomingCalendarEvents: calendarEvents.slice(0, 15) }),
    };

    const systemPrompt = [
      'Analyze this task and suggest a realistic due date based on complexity.',
      calendarEvents?.length
        ? 'Calendar events are provided — avoid suggesting dates where the user is heavily booked. Factor in their availability.'
        : '',
      'Respond with JSON: {suggested_date (ISO date), complexity (low/medium/high), buffer_days, risk_factors (array)}.',
    ].filter(Boolean).join(' ');

    const result = await callJSON<{
      suggested_date: string;
      complexity: 'low' | 'medium' | 'high';
      buffer_days: number;
      risk_factors: string[];
    }>(systemPrompt, JSON.stringify(context));
    await logInteraction(userId, input.title, 'smart_due_date');
    return result;
  },

  async decomposeGoal(userId: string, input: { goal: string; timeframe?: string }) {
    const systemPrompt = [
      'Decompose this goal into 5-10 actionable tasks with dependencies.',
      buildDateScaffold(),
      'When the goal mentions a deadline ("by end of month", "by Friday"), use the reference table to size estimated_hours and ordering accordingly.',
      'Respond with JSON: {tasks: [{title, description, priority (low/medium/high/urgent), estimated_hours, dependencies (indices of prerequisite tasks)}]}',
    ].join('\n\n');
    const result = await callJSON<{
      tasks: Array<{ title: string; description: string; priority: string; estimated_hours: number; dependencies: number[] }>;
    }>(systemPrompt, JSON.stringify(input));
    await logInteraction(userId, input.goal, 'goal_decompose');
    return result;
  },

  // === Phase 3: Collaboration & planning ===

  async analyzeDependencies(userId: string, boardId: string) {
    const boardCards = await db
      .select({ id: cards.id, title: cards.title, description: cards.description })
      .from(cards)
      .innerJoin(lists, eq(cards.listId, lists.id))
      .where(eq(lists.boardId, boardId));

    const result = await callJSON<{
      dependencies: Array<{ from: string; to: string; type: string; reason: string }>;
    }>(
      'Analyze these tasks and identify likely dependencies. Respond with JSON: {dependencies: [{from (card title), to (card title), type (blocks/requires/relates), reason}]}',
      JSON.stringify(boardCards),
    );
    await logInteraction(userId, `board:${boardId}`, 'dependency_analysis');
    return result;
  },

  async balanceWorkload(userId: string, boardId: string) {
    const boardCards = await db
      .select({
        id: cards.id,
        title: cards.title,
        assigneeId: cards.assigneeId,
        estimatedHours: cards.estimatedHours,
        priority: cards.priority,
      })
      .from(cards)
      .innerJoin(lists, eq(cards.listId, lists.id))
      .where(eq(lists.boardId, boardId));

    const calendarEvents = await getCalendarEvents(userId).catch(() => []);

    const context = {
      cards: boardCards,
      ...(calendarEvents?.length && { calendarCommitments: calendarEvents.slice(0, 15) }),
    };

    const systemPrompt = [
      'Analyze workload distribution.',
      calendarEvents?.length
        ? 'Calendar events show external commitments — factor meeting-heavy days into workload analysis.'
        : '',
      'Respond with JSON: {analysis, suggestions: [{action, reason, cardIds}]}',
    ].filter(Boolean).join(' ');

    const result = await callJSON<{
      analysis: string;
      suggestions: Array<{ action: string; reason: string; cardIds: string[] }>;
    }>(systemPrompt, JSON.stringify(context));
    await logInteraction(userId, `board:${boardId}`, 'workload_balance');
    return result;
  },

  async analyzeMeeting(userId: string, transcript: string, boardId?: string) {
    const systemPrompt = [
      'Extract action items, decisions, and questions from this meeting transcript.',
      buildDateScaffold(),
      'Respond with JSON: {summary, action_items: [{title, assignee, priority (low/medium/high/urgent), due_date (YYYY-MM-DD; look up from the reference table — do not compute)}], decisions: [...], questions: [...]}',
    ].join('\n\n');
    const result = await callJSON<{
      summary: string;
      action_items: Array<{ title: string; assignee?: string; priority: string; due_date?: string }>;
      decisions: string[];
      questions: string[];
    }>(systemPrompt, transcript);
    await logInteraction(userId, 'meeting', 'meeting_analyze', { boardId });
    return result;
  },

  // === Phase 4: Insights & analytics ===

  async getBriefing(userId: string, type: 'daily' | 'weekly', boardId?: string) {
    const conditions = boardId ? eq(lists.boardId, boardId) : eq(boards.userId, userId);
    const allCards = await db
      .select({
        title: cards.title,
        priority: cards.priority,
        isCompleted: cards.isCompleted,
        dueDate: cards.dueDate,
      })
      .from(cards)
      .innerJoin(lists, eq(cards.listId, lists.id))
      .innerJoin(boards, eq(lists.boardId, boards.id))
      .where(conditions);

    const stats = {
      total: allCards.length,
      completed: allCards.filter((c) => c.isCompleted).length,
      overdue: allCards.filter((c) => c.dueDate && c.dueDate < new Date() && !c.isCompleted).length,
    };

    // Enrich with integration context (non-blocking fallback)
    const integrations = await getIntegrationContext(userId).catch(() => null);
    const calendarEvents = await getCalendarEvents(userId).catch(() => []);

    const context = {
      stats,
      sample: allCards.slice(0, 20),
      ...(integrations && {
        connectedServices: integrations.connectedServices,
        recentIntegrationEvents: integrations.recentEvents.slice(0, 10),
      }),
      ...(calendarEvents?.length && { upcomingCalendarEvents: calendarEvents.slice(0, 10) }),
    };

    const systemPrompt = [
      `Generate a ${type} briefing.`,
      'highlights = 3–5 short imperative actions to take TODAY. Each starts with a verb ("Ship", "Prep", "Unblock", "Review", "Decide"). Concrete, specific to actual cards or events from the context, ≤12 words. Never restate stats and never describe state — only direct actions the user can take today.',
      'recommendations = 2–3 longer-horizon nudges or systemic patterns that are NOT already in highlights. Cover this week / next, or recurring patterns (e.g. "Three demo prep tasks have slipped twice — break them down further"). Skip if nothing new to say.',
      'briefing = one short paragraph of prose context. Stats and overdue counts belong here, not in highlights.',
      'Highlights and recommendations must not overlap or restate each other. If you cannot produce 3 distinct, actionable highlights, return fewer.',
      'Respond with JSON: {briefing (paragraph), highlights (string[]), recommendations (string[])}.',
      integrations?.connectedServices.length
        ? `The user has these integrations connected: ${integrations.connectedServices.join(', ')}. Reference relevant integration activity in the briefing paragraph.`
        : '',
      calendarEvents?.length
        ? 'Calendar events are included — surface scheduling conflicts as imperative highlights when there is a concrete action.'
        : '',
    ].filter(Boolean).join(' ');

    const result = await callJSON<{ briefing: string; highlights: string[]; recommendations: string[] }>(
      systemPrompt,
      JSON.stringify(context),
    );
    await logInteraction(userId, type, 'briefing');
    return { ...result, stats };
  },

  async productivityAnalysis(userId: string, boardId?: string) {
    const result = await callJSON<{
      patterns: string[];
      bottlenecks: string[];
      recommendations: string[];
    }>(
      'Analyze productivity patterns. Respond with JSON: {patterns, bottlenecks, recommendations}',
      JSON.stringify({ userId, boardId }),
    );
    await logInteraction(userId, boardId ?? 'all', 'productivity_analysis');
    return result;
  },

  async riskAnalysis(userId: string, boardId: string) {
    const boardCards = await db
      .select({
        title: cards.title,
        priority: cards.priority,
        dueDate: cards.dueDate,
        progress: cards.progress,
      })
      .from(cards)
      .innerJoin(lists, eq(cards.listId, lists.id))
      .where(eq(lists.boardId, boardId));

    const result = await callJSON<{
      risks: Array<{ severity: 'low' | 'medium' | 'high'; description: string; mitigation: string }>;
    }>(
      'Identify project risks. Respond with JSON: {risks: [{severity, description, mitigation}]}',
      JSON.stringify(boardCards),
    );
    await logInteraction(userId, `board:${boardId}`, 'risk_analysis');
    return result;
  },

  async voiceToTask(userId: string, audioBase64: string) {
    // Decode audio and transcribe
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const transcription = await openai.audio.transcriptions.create({
      file: new File([audioBuffer], 'audio.webm', { type: 'audio/webm' }),
      model: 'whisper-1',
    });

    const parsed = await this.parseTask(userId, transcription.text);
    return { transcript: transcription.text, task: parsed };
  },
};
