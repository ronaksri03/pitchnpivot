import EnhancedProfile from '@/components/profile/EnhancedProfile';

const mockIndividual = {
  name: 'Priya Sharma',
  jobTitle: 'Full Stack Engineer',
  introVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  location: 'San Francisco, CA',
  yearsExp: 4,
  hourlyRate: 85,
  availability: 'Full-time',
  bio: 'Passionate about building scalable web applications. 4 years shipping products at startups.',
  lookingFor: 'Exciting projects with measurable impact',
  skills: ['React', 'Node.js', 'PostgreSQL', 'AWS', 'TypeScript'],
  projectsCompleted: 12,
  profileViews: 284,
};

export default function ProfilePage() {
  return <EnhancedProfile individual={mockIndividual} manager={true} />;
}
