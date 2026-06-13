import React, { useState, useRef } from 'react';
import {
  Zap, Heart, X, MessageSquare, Share2, Filter, ChevronDown,
  Star, MapPin, Briefcase, Clock, DollarSign, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ===== DISCOVER PAGE (Swipeable Talent Cards) =====
export const DiscoverPage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    skills: [],
    minExp: 0,
    maxRate: 150,
    availability: 'all',
    location: 'all',
  });

  // Mock talent data
  const talents = [
    {
      id: 1,
      name: 'Priya Sharma',
      title: 'Full Stack Engineer',
      location: 'San Francisco, CA',
      imageUrl: 'https://via.placeholder.com/500x600',
      videoThumbnail: 'https://via.placeholder.com/500x600/c8ff00/0a0a0a?text=Video',
      bio: 'Passionate about building scalable web apps. 4 years shipping products.',
      skills: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
      yearsExp: 4,
      hourlyRate: 85,
      availability: 'Full-time',
      workPref: 'Remote',
      profileViews: 120,
      videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
    },
    {
      id: 2,
      name: 'Alex Chen',
      title: 'Product Designer',
      location: 'New York, NY',
      imageUrl: 'https://via.placeholder.com/500x600',
      videoThumbnail: 'https://via.placeholder.com/500x600/ff006e/0a0a0a?text=Video',
      bio: 'Design systems obsessed. Worked at 3 startups, shipping pixel-perfect UIs.',
      skills: ['Figma', 'User Research', 'Prototyping', 'Interaction Design'],
      yearsExp: 6,
      hourlyRate: 95,
      availability: 'Freelance',
      workPref: 'Hybrid',
      profileViews: 340,
      videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
    },
    {
      id: 3,
      name: 'Jordan Williams',
      title: 'Growth Marketing Manager',
      location: 'Austin, TX',
      imageUrl: 'https://via.placeholder.com/500x600',
      videoThumbnail: 'https://via.placeholder.com/500x600/00f5ff/0a0a0a?text=Video',
      bio: 'Data-driven marketer. Scaled 2 companies to $10M ARR.',
      skills: ['Analytics', 'SEO', 'Content Strategy', 'CRM'],
      yearsExp: 5,
      hourlyRate: 75,
      availability: 'Part-time',
      workPref: 'Remote',
      profileViews: 210,
      videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
    },
  ];

  const current = talents[currentIndex];
  const progress = ((currentIndex + 1) / talents.length) * 100;

  const handleSwipe = (newDirection) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => (prev + 1) % talents.length);
  };

  const handleSave = () => {
    console.log('Saved:', current.name);
    handleSwipe(1);
  };

  const handleReject = () => {
    console.log('Rejected:', current.name);
    handleSwipe(-1);
  };

  return (
    <div className="bg-[#0a0a0a] text-[#f0ece4] min-h-screen">
      {/* ===== HEADER ===== */}
      <motion.header
        className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-[#2d2d2d] py-4 px-6 md:px-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Mono' }}>
              Discover Talent
            </h1>
            <p className="text-sm text-[#2d2d2d] font-mono">Swipe through {talents.length} profiles</p>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-3 bg-[#1a1a1a] text-[#c8ff00] rounded-lg hover:bg-[#2d2d2d] transition-all flex items-center gap-2"
          >
            <Filter size={20} />
            <span className="text-sm font-mono uppercase hidden sm:inline">Filter</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#c8ff00] to-[#ff006e]"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
      </motion.header>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-16 grid md:grid-cols-3 gap-8">
        {/* ===== CARD STACK (Left) ===== */}
        <div className="md:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: direction > 0 ? 500 : -500, rotateZ: direction > 0 ? 45 : -45 }}
              animate={{ opacity: 1, x: 0, rotateZ: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? 500 : -500, rotateZ: direction > 0 ? 45 : -45 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative"
            >
              {/* Main Card */}
              <div className="relative bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-2xl overflow-hidden border border-[#2d2d2d] shadow-2xl">
                {/* Video Thumbnail with Play Button */}
                <div className="relative h-96 md:h-[500px] bg-[#0a0a0a] group overflow-hidden">
                  <img
                    src={current.videoThumbnail}
                    alt={current.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Film Strip Overlay (Signature) */}
                  <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#0a0a0a] to-transparent flex gap-1 px-3 items-center z-10">
                    {[...Array(30)].map((_, i) => (
                      <div key={i} className="w-0.5 h-2 bg-[#2d2d2d]" />
                    ))}
                  </div>

                  {/* Play Button */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all cursor-pointer"
                    whileHover={{ scale: 1.1 }}
                  >
                    <motion.div
                      className="w-20 h-20 rounded-full bg-[#c8ff00] flex items-center justify-center shadow-2xl"
                      whileHover={{ scale: 1.15 }}
                    >
                      <play className="w-8 h-8 text-[#0a0a0a] fill-current ml-1" />
                    </motion.div>
                  </motion.div>

                  {/* Profile Views Badge */}
                  <div className="absolute top-6 right-6 px-3 py-2 bg-[#0a0a0a]/80 backdrop-blur rounded-lg flex items-center gap-2 border border-[#2d2d2d]">
                    <Eye size={16} className="text-[#c8ff00]" />
                    <span className="text-sm font-mono">{current.profileViews} views</span>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="p-6 md:p-8 space-y-4">
                  {/* Name & Title */}
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Space Mono' }}>
                      {current.name}
                    </h2>
                    <p className="text-xl text-[#c8ff00] mt-1">{current.title}</p>
                  </div>

                  {/* Quick Info Chips */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    <div className="px-3 py-2 bg-[#1a1a1a] text-[#00f5ff] text-sm font-mono rounded-lg border border-[#00f5ff] flex items-center gap-2">
                      <MapPin size={14} /> {current.location}
                    </div>
                    <div className="px-3 py-2 bg-[#1a1a1a] text-[#c8ff00] text-sm font-mono rounded-lg border border-[#c8ff00] flex items-center gap-2">
                      <Briefcase size={14} /> {current.yearsExp}y exp
                    </div>
                    <div className="px-3 py-2 bg-[#1a1a1a] text-[#ff006e] text-sm font-mono rounded-lg border border-[#ff006e] flex items-center gap-2">
                      <DollarSign size={14} /> ${current.hourlyRate}/hr
                    </div>
                    <div className="px-3 py-2 bg-[#1a1a1a] text-[#f0ece4] text-sm font-mono rounded-lg flex items-center gap-2">
                      <Clock size={14} /> {current.availability}
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-[#2d2d2d] leading-relaxed pt-2">
                    {current.bio}
                  </p>

                  {/* Skills */}
                  <div className="pt-4">
                    <p className="text-xs uppercase tracking-widest text-[#2d2d2d] mb-3">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {current.skills.map((skill, i) => (
                        <motion.span
                          key={i}
                          className="px-3 py-1 bg-[#0a0a0a] text-[#c8ff00] text-xs font-mono rounded-full border border-[#c8ff00] cursor-pointer hover:bg-[#c8ff00] hover:text-[#0a0a0a] transition-all"
                          whileHover={{ scale: 1.05 }}
                        >
                          {skill}
                        </motion.span>
                      ))}
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex gap-3 pt-6 border-t border-[#2d2d2d]">
                    <motion.button
                      onClick={() => console.log('View profile:', current.name)}
                      className="flex-1 px-4 py-3 bg-[#1a1a1a] text-[#f0ece4] rounded-lg border border-[#2d2d2d] hover:border-[#c8ff00] transition-all font-mono text-sm uppercase tracking-wide"
                      whileHover={{ borderColor: '#c8ff00' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      View Full Profile
                    </motion.button>
                    <motion.button
                      onClick={() => console.log('Message:', current.name)}
                      className="px-4 py-3 bg-[#1a1a1a] text-[#00f5ff] rounded-lg border border-[#00f5ff] hover:bg-[#00f5ff] hover:text-[#0a0a0a] transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <MessageSquare size={20} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ===== SWIPE ACTIONS ===== */}
          <div className="flex gap-4 mt-8 justify-center">
            <motion.button
              onClick={handleReject}
              className="p-4 rounded-full bg-[#1a1a1a] text-[#ff006e] border-2 border-[#ff006e] hover:bg-[#ff006e] hover:text-[#0a0a0a] transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={28} />
            </motion.button>

            <motion.button
              onClick={() => console.log('Message:', current.name)}
              className="p-4 rounded-full bg-[#00f5ff] text-[#0a0a0a] hover:scale-110 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MessageSquare size={28} />
            </motion.button>

            <motion.button
              onClick={handleSave}
              className="p-4 rounded-full bg-[#c8ff00] text-[#0a0a0a] hover:scale-110 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Heart size={28} />
            </motion.button>

            <motion.button
              onClick={() => console.log('Share:', current.name)}
              className="p-4 rounded-full bg-[#1a1a1a] text-[#c8ff00] border-2 border-[#c8ff00] hover:bg-[#c8ff00] hover:text-[#0a0a0a] transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Share2 size={28} />
            </motion.button>
          </div>
        </div>

        {/* ===== FILTER PANEL (Right) ===== */}
        <motion.div
          className="md:col-span-1 space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 sticky top-24">
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Mono' }}>
              Filters
            </h3>

            {/* Experience Range */}
            <div className="space-y-4 pb-6 border-b border-[#2d2d2d]">
              <label className="text-sm uppercase tracking-widest text-[#2d2d2d] block">
                Experience Level
              </label>
              <div className="space-y-2">
                {['All', '1-2 years', '3-5 years', '5+ years'].map((level, i) => (
                  <motion.label
                    key={i}
                    className="flex items-center gap-3 cursor-pointer group"
                    whileHover={{ x: 4 }}
                  >
                    <input type="radio" name="exp" className="w-4 h-4 accent-[#c8ff00] cursor-pointer" />
                    <span className="text-sm group-hover:text-[#c8ff00] transition-colors">{level}</span>
                  </motion.label>
                ))}
              </div>
            </div>

            {/* Hourly Rate */}
            <div className="space-y-4 pb-6 border-b border-[#2d2d2d]">
              <label className="text-sm uppercase tracking-widest text-[#2d2d2d] block">
                Max Hourly Rate
              </label>
              <div className="space-y-3">
                <input
                  type="range"
                  min="25"
                  max="200"
                  value={filters.maxRate}
                  onChange={(e) => setFilters({ ...filters, maxRate: e.target.value })}
                  className="w-full accent-[#c8ff00]"
                />
                <div className="text-right text-sm font-bold text-[#c8ff00]">
                  Up to ${filters.maxRate}/hr
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-4 pb-6 border-b border-[#2d2d2d]">
              <label className="text-sm uppercase tracking-widest text-[#2d2d2d] block">
                Availability
              </label>
              <div className="space-y-2">
                {['Full-time', 'Part-time', 'Freelance', 'All'].map((avail, i) => (
                  <motion.label key={i} className="flex items-center gap-3 cursor-pointer group" whileHover={{ x: 4 }}>
                    <input type="checkbox" className="w-4 h-4 accent-[#c8ff00] cursor-pointer" />
                    <span className="text-sm group-hover:text-[#c8ff00] transition-colors">{avail}</span>
                  </motion.label>
                ))}
              </div>
            </div>

            {/* Popular Skills */}
            <div className="space-y-4">
              <label className="text-sm uppercase tracking-widest text-[#2d2d2d] block">
                Popular Skills
              </label>
              <div className="flex flex-wrap gap-2">
                {['React', 'Node.js', 'Python', 'Figma', 'Product', 'AWS', 'Go'].map((skill, i) => (
                  <motion.button
                    key={i}
                    className="px-3 py-1 text-xs bg-[#0a0a0a] text-[#c8ff00] border border-[#c8ff00] rounded-full hover:bg-[#c8ff00] hover:text-[#0a0a0a] transition-all cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                  >
                    {skill}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <motion.button
              className="w-full mt-6 py-2 text-sm font-mono uppercase text-[#2d2d2d] hover:text-[#c8ff00] transition-colors"
              whileHover={{ scale: 1.02 }}
            >
              Reset Filters
            </motion.button>
          </div>

          {/* Saved Profiles Preview */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold" style={{ fontFamily: 'Space Mono' }}>Saved</h4>
              <span className="text-[#c8ff00] font-bold">12</span>
            </div>
            <motion.button
              className="w-full py-2 bg-[#c8ff00] text-[#0a0a0a] rounded-lg font-bold hover:scale-105 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View Saved Profiles
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DiscoverPage;
