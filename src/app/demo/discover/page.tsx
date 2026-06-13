import DiscoverPage from '@/components/discover/DiscoverPage';

export default function DiscoverDemoPage() {
  return (
    <>
      <div style={{ background: '#c8ff00', color: '#0a0a0a', textAlign: 'center', padding: '8px 16px', fontSize: 13, fontWeight: 700 }}>
        DESIGN DEMO — sample data only. The live discover page is at /discover.
      </div>
      <DiscoverPage />
    </>
  );
}
