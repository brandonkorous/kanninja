// Skeleton placeholder matching the exact shape of BoardCard. Rendered
// during initial load so the user sees the layout immediately instead of a
// spinner. DaisyUI's .skeleton class handles the subtle pulse animation.

export function BoardCardSkeleton() {
    return (
        <div className="bg-base-100 rounded-lg shadow-e1 p-6 flex flex-col min-h-44">
            <div className="skeleton h-5 w-5 rounded-sm" />
            <div className="skeleton h-6 w-3/4 mt-8 rounded-sm" />
            <div className="skeleton h-4 w-full mt-3 rounded-sm" />
            <div className="skeleton h-4 w-1/2 mt-2 rounded-sm" />
            <div className="mt-6 pt-4 border-t border-base-300 flex items-center justify-between">
                <div className="skeleton h-3 w-12 rounded-sm" />
                <div className="skeleton h-3 w-16 rounded-sm" />
            </div>
        </div>
    );
}
