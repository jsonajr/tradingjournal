"use client";
import dynamic from "next/dynamic";

const QuickTradeButtons = dynamic(
  () => import("@/components/journal/quick-trade-buttons").then((m) => m.QuickTradeButtons),
  { ssr: false }
);

type Account = { id: string; name: string };

export function QuickTradeWrapper({ accounts, userId, popupEnabled }: { accounts: Account[]; userId: string; popupEnabled?: boolean }) {
  return <QuickTradeButtons accounts={accounts} userId={userId} popupEnabled={popupEnabled} />;
}