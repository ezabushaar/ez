"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.refresh();
      }}
      className="text-sm text-night-800/60 hover:text-gold-600"
    >
      Sign out
    </button>
  );
}
