'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Play, Heart, MessageSquare, Share2, Download, ArrowDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ===== ENHANCED INDIVIDUAL PROFILE (Video CV) =====
export const EnhancedProfile = ({ individual, manager }) => {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');
  const [showSaved, setShowSaved] = useState(false);
  const videoRef = useRef(null);

  return (
    <div className="bg-[#0a0a0a] text-[#f0ece4] min-h-screen overflow-hidden">
      {/* ===== HERO: FULL-SCREEN VIDEO CV ===== */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden group">
        {/* Video Container with Film Strip Frame */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Film Strip Frame Border (Signature Element) */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-8 bg-[#0a0a0a] flex gap-2 px-4 items-center">
              {[...Array(40)].map((_, i) => (
                <div key={i} className="w-1 h-4 bg-[#2d2d2d] rounded-xs" />
              ))}
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#0a0a0a] flex gap-2 px-4 items-center">
              {[...Array(40)].map((_, i) => (
                <div key={i} className="w-1 h-4 bg-[#2d2d2d] rounded-xs" />
              ))}
            </div>
          </div>

          {/* Video Background */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] via-[#0a0a0a] to-[#0a0a0a]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <video
              ref={videoRef}
              src={individual.introVideoUrl}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              onPlay={() => setVideoPlaying(true)}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          </motion.div>

          {/* Hero Content Overlay */}
          <motion.div 
            className="absolute inset-0 flex flex-col justify-between p-8 md:p-16 z-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Top: Name & Role */}
            <div className="space-y-4">
              <h1 className="text-6xl md:text-7xl font-bold tracking-tight" style={{ fontFamily: 'Space Mono' }}>
                {individual.name}
              </h1>
              <p className="text-2xl md:text-3xl text-[#c8ff00] font-medium">
                {individual.jobTitle}
              </p>
            </div>

            {/* Bottom: Quick Info + CTA */}
            <div className="flex items-end justify-between">
              <div className="space-y-3">
                <div className="flex gap-4 text-sm uppercase tracking-wide">
                  <span className="px-3 py-1 bg-[#c8ff00] text-[#0a0a0a] rounded-full font-bold">
                    {individual.yearsExp}y exp
                  </span>
                  <span className="px-3 py-1 bg-[#1a1a1a] text-[#c8ff00] rounded-full border border-[#c8ff00]">
                    {individual.location}
                  </span>
                  <span className="px-3 py-1 bg-[#1a1a1a] text-[#00f5ff] rounded-full border border-[#00f5ff]">
                    {individual.availability}
                  </span>
                </div>
                <p className="text-lg text-[#f0ece4] max-w-md">
                  "{individual.lookingFor}"
                </p>
              </div>

              {/* Action Buttons */}
              {manager ? (
                <motion.div 
                  className="flex gap-3"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <button className="p-3 bg-[#c8ff00] text-[#0a0a0a] rounded-lg hover:bg-[#b8ef00] transition-all hover:scale-110">
                    <MessageSquare size={24} />
                  </button>
                  <button className="p-3 bg-[#ff006e] text-white rounded-lg hover:bg-[#ff1e7f] transition-all hover:scale-110">
                    <Heart size={24} />
                  </button>
                  <button className="px-6 py-3 bg-[#c8ff00] text-[#0a0a0a] rounded-lg font-bold hover:scale-105 transition-all flex gap-2 items-center">
                    View Projects <ChevronRight size={20} />
                  </button>
                </motion.div>
              ) : (
                <div className="flex gap-3">
                  <motion.button 
                    className="px-6 py-3 bg-[#c8ff00] text-[#0a0a0a] rounded-lg font-bold hover:scale-105 transition-all"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Sign in to hire
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div 
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-[#2d2d2d]">Scroll</span>
              <ArrowDown size={20} className="text-[#c8ff00]" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== ABOUT SECTION ===== */}
      <section className="py-20 px-8 md:px-16 bg-[#0a0a0a] border-t border-[#2d2d2d]">
        <div className="max-w-4xl mx-auto space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h2 className="text-4xl font-bold" style={{ fontFamily: 'Space Mono' }}>About</h2>
            <p className="text-lg leading-relaxed text-[#2d2d2d]">{individual.bio}</p>
          </motion.div>

          {/* Skills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-bold" style={{ fontFamily: 'Space Mono' }}>Skills</h3>
            <div className="flex flex-wrap gap-3">
              {individual.skills.map((skill, i) => (
                <motion.span
                  key={i}
                  className="px-4 py-2 bg-[#1a1a1a] text-[#c8ff00] rounded-full text-sm font-mono border border-[#c8ff00] cursor-pointer hover:bg-[#c8ff00] hover:text-[#0a0a0a] transition-all"
                  whileHover={{ scale: 1.05 }}
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-12 border-t border-[#2d2d2d]"
          >
            {[
              { label: 'Projects Done', value: individual.projectsCompleted || 12 },
              { label: 'Profile Views', value: individual.profileViews || 284 },
              { label: 'Hourly Rate', value: `$${individual.hourlyRate}` },
              { label: 'Response Time', value: '< 2 hrs' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-[#c8ff00]">{stat.value}</div>
                <div className="text-xs uppercase tracking-widest text-[#2d2d2d] mt-2">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== REELS/VIDEOS SECTION ===== */}
      <section className="py-20 px-8 md:px-16 bg-[#1a1a1a] border-t border-[#2d2d2d]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <h2 className="text-4xl font-bold mb-12" style={{ fontFamily: 'Space Mono' }}>
            Work in Motion
          </h2>

          {/* Masonry Grid of Reels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="relative group cursor-pointer h-96 bg-[#0a0a0a] rounded-lg overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                {/* Thumbnail */}
                <div className="w-full h-full bg-gradient-to-b from-[#2d2d2d] to-[#0a0a0a] flex items-center justify-center relative">
                  {/* Film Strip Frame */}
                  <div className="absolute top-2 left-0 right-0 h-3 flex gap-1 px-2 justify-center">
                    {[...Array(15)].map((_, j) => (
                      <div key={j} className="w-0.5 h-2 bg-[#2d2d2d]" />
                    ))}
                  </div>

                  <div className="text-center">
                    <Play className="w-16 h-16 text-[#c8ff00] mx-auto mb-3" />
                    <p className="text-sm text-[#2d2d2d] font-mono">Video {i + 1}</p>
                  </div>

                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <p className="text-lg font-bold">Project: Design System</p>
                    <p className="text-xs text-[#2d2d2d] mt-1">3:45</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ===== PORTFOLIO PROJECTS ===== */}
      <section className="py-20 px-8 md:px-16 bg-[#0a0a0a] border-t border-[#2d2d2d]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-4xl font-bold" style={{ fontFamily: 'Space Mono' }}>
              Featured Projects
            </h2>
            <button className="text-[#c8ff00] hover:text-[#b8ef00] font-mono text-sm uppercase tracking-wider flex items-center gap-2">
              View all <ChevronRight size={16} />
            </button>
          </div>

          {/* Project Cards */}
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="group grid md:grid-cols-3 gap-6 pb-8 border-b border-[#2d2d2d] cursor-pointer"
                whileHover={{ x: 8 }}
              >
                {/* Project Image */}
                <div className="md:col-span-1 h-48 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-lg flex items-center justify-center overflow-hidden relative">
                  <div className="text-center text-[#2d2d2d]">
                    <div className="text-4xl font-bold">0{i + 1}</div>
                  </div>
                  <div className="absolute inset-0 bg-[#c8ff00] opacity-0 group-hover:opacity-10 transition-opacity" />
                </div>

                {/* Project Info */}
                <div className="md:col-span-2 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold group-hover:text-[#c8ff00] transition-colors">
                      Project: E-Commerce Dashboard
                    </h3>
                    <p className="text-[#2d2d2d] leading-relaxed">
                      Built a real-time analytics dashboard for an e-commerce platform using React, Node.js, and PostgreSQL. Increased conversion tracking accuracy by 40%.
                    </p>

                    {/* Skills Used */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {['React', 'Node.js', 'PostgreSQL', 'Tailwind'].map((skill, j) => (
                        <span key={j} className="text-xs px-2 py-1 bg-[#1a1a1a] text-[#00f5ff] rounded font-mono border border-[#00f5ff]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Links */}
                  <div className="flex gap-4 pt-4 mt-4 border-t border-[#2d2d2d]">
                    <a href="#" className="text-[#c8ff00] hover:underline font-mono text-sm flex items-center gap-2">
                      View Live <ChevronRight size={14} />
                    </a>
                    <a href="#" className="text-[#00f5ff] hover:underline font-mono text-sm flex items-center gap-2">
                      GitHub <ChevronRight size={14} />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ===== CALL TO ACTION SECTION ===== */}
      <section className="py-20 px-8 md:px-16 bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] border-t border-[#2d2d2d]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center space-y-8"
        >
          <h2 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: 'Space Mono' }}>
            Ready to Collaborate?
          </h2>
          <p className="text-lg text-[#2d2d2d]">
            Explore current projects, send a direct message, or download the full CV.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center pt-4">
            <motion.button
              className="px-8 py-4 bg-[#c8ff00] text-[#0a0a0a] rounded-lg font-bold uppercase tracking-wide flex items-center justify-center gap-2 hover:scale-105 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MessageSquare size={20} /> Send Message
            </motion.button>
            <motion.button
              className="px-8 py-4 bg-[#1a1a1a] text-[#c8ff00] rounded-lg font-bold uppercase tracking-wide border border-[#c8ff00] flex items-center justify-center gap-2 hover:bg-[#c8ff00] hover:text-[#0a0a0a] transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download size={20} /> Download CV
            </motion.button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default EnhancedProfile;
