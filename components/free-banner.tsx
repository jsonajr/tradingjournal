import Link from "next/link";

export function FreeBanner() {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-center text-xs text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2">
      <span>🔒 You&apos;re on the <strong>free plan</strong> — most features are disabled.</span>
      <Link href="/settings#subscription" className="underline font-semibold hover:text-amber-500">
        Contact admin to upgrade →
      </Link>
    </div>
  );
}