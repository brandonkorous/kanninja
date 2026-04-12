import { z } from 'zod';
import { ClanRole } from '../enums.js';

const clanRoleValues = Object.values(ClanRole) as [string, ...string[]];

export const createClanSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const updateClanSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});

export const inviteClanMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(clanRoleValues).optional().default(ClanRole.MEMBER),
});

export const updateClanMemberSchema = z.object({
  role: z.enum(clanRoleValues),
});

export const clanSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  createdBy: z.string().uuid(),
  // True for the auto-created personal clan on signup. UI uses this to
  // show a subtle "personal" tag and to disable deletion of the anchor.
  isPersonal: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Clan = z.infer<typeof clanSchema>;
export type CreateClanInput = z.infer<typeof createClanSchema>;
export type UpdateClanInput = z.infer<typeof updateClanSchema>;
export type InviteClanMemberInput = z.infer<typeof inviteClanMemberSchema>;
export type UpdateClanMemberInput = z.infer<typeof updateClanMemberSchema>;
