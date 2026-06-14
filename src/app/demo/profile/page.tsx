'use client';
import EnhancedProfile from '@/components/profile/EnhancedProfile';

const mockIndividual = {
  name: 'Priya Sharma',
  jobTitle: 'Full Stack Engineer',
  introVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  location: 'San Francisco, CA',
  yearsExp: 4,
  hourlyRate: 85,
  availability: 'Full-time',
  bio: 'Passionate about building scalable web applications.',
  lookingFor: 'Exciting projects with impact',
  skills: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
  projectsCompleted: 12,
  profileViews: 284,
};

export default function ProfileDemoPage() {
  return (
    <>
      <div style={{ background: '#c8ff00', color: '#0a0a0a', textAlign: 'center', padding: '8px 16px', fontSize: 13, fontWeight: 700 }}>
        DESIGN DEMO — Sample data only. Your real profile is at /profile
      </div>
      <EnhancedProfile individual={mockIndividual} manager={true} />
    </>
  );
}
