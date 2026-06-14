// src/app/discover/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { cookies } from "next/headers";
import ReelFeed from "@/components/ReelFeed";

export default async function DiscoverPage() {
  // Reading cookies forces Next.js to treat this as truly dynamic
  // and never prerender it as static HTML
  cookies();

  return (
    <main className="h-screen w-full overflow-hidden" style={{ background: "#0a0a0a" }}>
      <ReelFeed
        managerId=""
        managerCompany=""
        primaryProjectId=""
      />
    </main>
  );
}
