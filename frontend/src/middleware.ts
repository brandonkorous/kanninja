import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Protected routes are explicit. Anything not listed here is public —
// marketing pages, sign-in/up, invites, and webhooks all stay open by
// default. Add a route here when it ships under (app).
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/dojo(.*)',
  '/clans(.*)',
  '/ai-hub(.*)',
  '/templates(.*)',
  '/analytics(.*)',
  '/notifications(.*)',
  '/profile(.*)',
  '/settings(.*)',
  '/integrations(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
