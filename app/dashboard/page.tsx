import ManagerDashboard from '@/components/dashboard/ManagerDashboard';

const mockManager = {
  company: 'TechCorp',
  role: 'Hiring Manager',
};

export default function Page() {
  return <ManagerDashboard manager={mockManager} />;
}
