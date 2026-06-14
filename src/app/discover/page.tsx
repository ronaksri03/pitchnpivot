"use client";

import dynamic from "next/dynamic";

const ReelFeed = dynamic(() => import("@/components/ReelFeed"), { ssr: false });

export default function DiscoverPage() {
  return (
    <main className="h-screen w-full overflow-hidden" style={{ background: "#0a0a0a" }}>
      <ReelFeed managerId="" managerCompany="" primaryProjectId="" />
    </main>
  );
}
