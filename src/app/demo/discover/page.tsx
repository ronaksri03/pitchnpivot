'use client';
import DiscoverPage from '@/components/discover/DiscoverPage';

export default function DiscoverDemoPage() {
  return (
    <>
      <div style={{ background: '#c8ff00', color: '#0a0a0a', textAlign: 'center', padding: '8px 16px', fontSize: 13, fontWeight: 700 }}>
        DESIGN DEMO — Sample data only. Live discover is at /discover
      </div>
      <DiscoverPage />
    </>
  );
}
