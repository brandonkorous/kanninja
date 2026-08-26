import { z } from 'zod';

/**
 * The client-facing shape of a profile. Deliberately excludes the auth-provider
 * link (`userId` / the legacy `clerkUserId`) — those are backend-internal and
 * have no business crossing the API boundary.
 */
export const profileSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  bio: z.string().nullable(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  // Deliberately NOT settable here. The avatar is whatever bytes the user
  // uploaded to POST /api/v1/users/me/avatar; letting a client PATCH an
  // arbitrary URL in meant one member could point every other member's
  // browser at a host of their choosing.
});

export type Profile = z.infer<typeof profileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
