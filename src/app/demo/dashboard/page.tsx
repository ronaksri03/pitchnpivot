import ManagerDashboard from '@/components/dashboard/ManagerDashboard';

const mockManager = { company: 'TechCorp', role: 'Hiring Manager' };

export default function DashboardDemoPage() {
  return (
    <>
      <div style={{ background: '#c8ff00', color: '#0a0a0a', textAlign: 'center', padding: '8px 16px', fontSize: 13, fontWeight: 700 }}>
        DESIGN DEMO — sample data only. The live dashboard is at /dashboard.
      </div>
      <ManagerDashboard manager={mockManager} />
    </>
  );
}
