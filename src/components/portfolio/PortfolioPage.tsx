'use client';
import React, { useState } from 'react';
import {
  ExternalLink, Code, Play, Award, Eye, Heart, Share2, ChevronRight,
  Filter, Grid, List, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

// ===== PORTFOLIO PAGE (Project Showcase) =====
export const PortfolioPage = () => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const categories = ['All', 'Web', 'Mobile', 'Design', 'AI/ML'];

  const projects = [
    {
      id: 1,
      title: 'Real-time Analytics Dashboard',
      category: 'Web',
      description: 'Built a comprehensive analytics platform for e-commerce businesses. Real-time data visualization with WebSockets, predictive analytics using ML models.',
      skills: ['React', 'Node.js', 'PostgreSQL', 'WebSockets', 'TensorFlow'],
      image: 'https://via.placeholder.com/600x400',
      demoUrl: 'https://example.com',
      githubUrl: 'https://github.com/example',
      videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
      completionDate: '2024-03',
      impact: 'Increased client revenue by 40% in first month',
      views: 430,
      saves: 120,
      testimonial: '"This dashboard transformed how we understand our customers." — CEO, TechCorp',
      testimonialAuthor: 'Sarah Johnson',
      testimonialRole: 'CEO, TechCorp',
    },
    {
      id: 2,
      title: 'Mobile Fitness Tracking App',
      category: 'Mobile',
      description: 'Native iOS app with real-time workout tracking, AI-powered form analysis using computer vision, and social features.',
      skills: ['Swift', 'CoreML', 'Firebase', 'ARKit'],
      image: 'https://via.placeholder.com/600x400/ff006e/0a0a0a',
      demoUrl: 'https://example.com',
      githubUrl: 'https://github.com/example',
      videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
      completionDate: '2024-01',
      impact: '50k+ downloads in first month',
      views: 620,
      saves: 240,
      testimonial: `"Best fitness app I've used. The AI form detection is incredible." — User Review`,
      testimonialAuthor: '⭐⭐⭐⭐⭐ 4.8/5',
      testimonialRole: 'App Store',
    },
    {
      id: 3,
      title: 'Design System for SaaS Platform',
      category: 'Design',
      description: 'Created comprehensive design system with 200+ components, documentation, and code generation.',
      skills: ['Figma', 'Design Systems', 'Component Design', 'Documentation'],
      image: 'https://via.placeholder.com/600x400/00f5ff/0a0a0a',
      demoUrl: 'https://example.com',
      githubUrl: 'https://github.com/example',
      videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
      completionDate: '2023-11',
      impact: 'Reduced design-to-development time by 60%',
      views: 890,
      saves: 450,
      testimonial: '"This design system is beautiful and incredibly functional." — Design Lead',
      testimonialAuthor: 'Alex Chen',
      testimonialRole: 'Design Lead, StartupXYZ',
    },
    {
      id: 4,
      title: 'AI Content Generation Engine',
      category: 'AI/ML',
      description: 'Fine-tuned GPT-3 model for generating product descriptions, marketing copy, and social media content.',
      skills: ['Python', 'OpenAI API', 'Fine-tuning', 'Prompt Engineering'],
      image: 'https://via.placeholder.com/600x400/c8ff00/0a0a0a',
      demoUrl: 'https://example.com',
      githubUrl: 'https://github.com/example',
      videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
      completionDate: '2024-02',
      impact: 'Generated 10k+ pieces of content with 95% approval rate',
      views: 340,
      saves: 85,
      testimonial: '"Saves us 20 hours per week on content creation." — Marketing Manager',
      testimonialAuthor: 'Jamie Smith',
      testimonialRole: 'Marketing Manager, ContentCo',
    },
  ];

  const filteredProjects = selectedCategory === 'all'
    ? projects
    : projects.filter(p => p.category === selectedCategory);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <div className="bg-[#0a0a0a] text-[#f0ece4] min-h-screen">
      {/* ===== HEADER HERO ===== */}
      <section className="relative py-20 px-6 md:px-16 border-b border-[#2d2d2d] overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]" />

        <motion.div
          className="relative max-w-4xl mx-auto text-center space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block px-4 py-2 bg-[#1a1a1a] rounded-full border border-[#c8ff00]">
            <p className="text-sm font-mono text-[#c8ff00] uppercase tracking-widest">
              12 Featured Works
            </p>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold" style={{ fontFamily: 'Space Mono' }}>
            Featured Projects
          </h1>

          <p className="text-lg text-[#2d2d2d] max-w-2xl mx-auto">
            A curated collection of work across web, mobile, design, and AI. Each project represents deep technical expertise and measurable impact.
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6 pt-8 mt-8 border-t border-[#2d2d2d]">
            {[
              { value: '12', label: 'Projects' },
              { value: '4.2M', label: 'Impact Hours Saved' },
              { value: '98%', label: 'Client Satisfaction' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-[#c8ff00]">{stat.value}</div>
                <div className="text-xs uppercase tracking-widest text-[#2d2d2d] mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ===== FILTERS & VIEW MODE ===== */}
      <section className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#2d2d2d] py-4 px-6 md:px-16">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {categories.map((cat, i) => (
              <motion.button
                key={i}
                onClick={() => setSelectedCategory(cat === 'All' ? 'all' : cat)}
                className={`px-4 py-2 rounded-lg font-mono text-sm uppercase tracking-wider whitespace-nowrap transition-all ${
                  (cat === 'All' ? selectedCategory === 'all' : selectedCategory === cat)
                    ? 'bg-[#c8ff00] text-[#0a0a0a]'
                    : 'bg-[#1a1a1a] text-[#2d2d2d] border border-[#2d2d2d] hover:border-[#c8ff00]'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {cat}
              </motion.button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 bg-[#1a1a1a] rounded-lg p-1 border border-[#2d2d2d]">
            <motion.button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#c8ff00] text-[#0a0a0a]'
                  : 'text-[#2d2d2d] hover:text-[#f0ece4]'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Grid size={20} />
            </motion.button>
            <motion.button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-all ${
                viewMode === 'list'
                  ? 'bg-[#c8ff00] text-[#0a0a0a]'
                  : 'text-[#2d2d2d] hover:text-[#f0ece4]'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <List size={20} />
            </motion.button>
          </div>
        </div>
      </section>

      {/* ===== PROJECTS GRID ===== */}
      <section className="py-16 px-6 md:px-16">
        <motion.div
          className={`max-w-7xl mx-auto ${
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 gap-8'
              : 'space-y-6'
          }`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredProjects.map((project, i) => (
            <motion.div
              key={project.id}
              variants={itemVariants}
              onClick={() => setSelectedProject(project)}
              className="group cursor-pointer"
            >
              <div className={`
                bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-xl overflow-hidden
                border border-[#2d2d2d] hover:border-[#c8ff00] transition-all duration-300
                ${viewMode === 'list' ? 'flex gap-6' : ''}
              `}>
                {/* Project Image */}
                <div className={`
                  relative bg-[#0a0a0a] overflow-hidden
                  ${viewMode === 'grid' ? 'h-64 w-full' : 'h-48 w-48 flex-shrink-0'}
                `}>
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />

                  {/* Film Strip Frame */}
                  <div className="absolute top-0 left-0 right-0 h-3 flex gap-1 px-2 justify-center bg-[#0a0a0a]">
                    {[...Array(20)].map((_, j) => (
                      <div key={j} className="w-0.5 h-2 bg-[#2d2d2d]" />
                    ))}
                  </div>

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all">
                    <motion.div
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      whileHover={{ scale: 1.1 }}
                    >
                      <div className="w-16 h-16 rounded-full bg-[#c8ff00] flex items-center justify-center shadow-2xl">
                        <Play className="w-6 h-6 text-[#0a0a0a] fill-current ml-1" />
                      </div>
                    </motion.div>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-6 right-6 px-3 py-1 bg-[#0a0a0a]/80 backdrop-blur rounded-full text-xs font-mono uppercase tracking-widest text-[#c8ff00] border border-[#c8ff00]">
                    {project.category}
                  </div>

                  {/* Engagement Stats */}
                  <div className="absolute bottom-6 left-6 flex gap-4 text-xs">
                    <div className="flex items-center gap-1 bg-[#0a0a0a]/80 backdrop-blur px-2 py-1 rounded-full border border-[#2d2d2d]">
                      <Eye size={14} className="text-[#00f5ff]" />
                      <span>{project.views}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-[#0a0a0a]/80 backdrop-blur px-2 py-1 rounded-full border border-[#2d2d2d]">
                      <Heart size={14} className="text-[#ff006e]" />
                      <span>{project.saves}</span>
                    </div>
                  </div>
                </div>

                {/* Project Info */}
                <div className={`p-6 flex flex-col justify-between ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold group-hover:text-[#c8ff00] transition-colors" style={{ fontFamily: 'Space Mono' }}>
                      {project.title}
                    </h3>

                    <p className="text-[#2d2d2d] leading-relaxed">
                      {project.description}
                    </p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {project.skills.slice(0, 4).map((skill, j) => (
                        <span
                          key={j}
                          className="px-2 py-1 text-xs bg-[#0a0a0a] text-[#c8ff00] rounded-full border border-[#c8ff00] font-mono"
                        >
                          {skill}
                        </span>
                      ))}
                      {project.skills.length > 4 && (
                        <span className="px-2 py-1 text-xs text-[#2d2d2d] font-mono">
                          +{project.skills.length - 4} more
                        </span>
                      )}
                    </div>

                    {/* Impact */}
                    <div className="pt-2 border-t border-[#2d2d2d]">
                      <p className="text-sm text-[#c8ff00] font-mono uppercase tracking-widest">Impact</p>
                      <p className="text-[#f0ece4] text-sm mt-1">{project.impact}</p>
                    </div>
                  </div>

                  {/* Action Links */}
                  <div className="flex gap-3 pt-4 mt-4 border-t border-[#2d2d2d]">
                    <a
                      href={project.demoUrl}
                      className="flex-1 px-4 py-2 bg-[#c8ff00] text-[#0a0a0a] rounded-lg font-mono text-sm uppercase tracking-wide hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={16} /> Live Demo
                    </a>
                    <a
                      href={project.githubUrl}
                      className="flex-1 px-4 py-2 bg-[#1a1a1a] text-[#c8ff00] rounded-lg border border-[#c8ff00] font-mono text-sm uppercase tracking-wide hover:bg-[#c8ff00] hover:text-[#0a0a0a] transition-all flex items-center justify-center gap-2"
                    >
                      <Code size={16} /> Code
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== PROJECT DETAIL MODAL ===== */}
      {selectedProject && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedProject(null)}
        >
          <motion.div
            className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-96 bg-[#0a0a0a]">
              <img
                src={selectedProject.image}
                alt={selectedProject.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 p-2 bg-[#0a0a0a]/80 rounded-lg text-[#c8ff00] hover:bg-[#c8ff00] hover:text-[#0a0a0a] transition-all"
              >
                ✕
              </button>

              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div whileHover={{ scale: 1.1 }}>
                  <div className="w-20 h-20 rounded-full bg-[#c8ff00] flex items-center justify-center shadow-2xl cursor-pointer">
                    <Play className="w-8 h-8 text-[#0a0a0a] fill-current ml-1" />
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Mono' }}>
                  {selectedProject.title}
                </h2>
                <p className="text-[#c8ff00] font-mono uppercase tracking-widest text-sm">
                  {selectedProject.category} • {selectedProject.completionDate}
                </p>
              </div>

              <p className="text-[#2d2d2d] leading-relaxed text-lg">
                {selectedProject.description}
              </p>

              <div>
                <p className="text-xs uppercase tracking-widest text-[#2d2d2d] mb-3">Technologies Used</p>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.skills.map((skill: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-[#0a0a0a] text-[#c8ff00] rounded-full text-xs font-mono border border-[#c8ff00]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Testimonial */}
              <div className="bg-gradient-to-r from-[#0a0a0a] to-[#1a1a1a] p-6 rounded-lg border border-[#2d2d2d]">
                <p className="text-[#f0ece4] italic mb-3">"{selectedProject.testimonial}"</p>
                <div>
                  <p className="font-bold">{selectedProject.testimonialAuthor}</p>
                  <p className="text-xs text-[#2d2d2d] font-mono">{selectedProject.testimonialRole}</p>
                </div>
              </div>

              <div className="border-t border-[#2d2d2d] pt-6">
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={selectedProject.demoUrl}
                    className="px-4 py-3 bg-[#c8ff00] text-[#0a0a0a] rounded-lg font-bold uppercase tracking-wide hover:scale-105 transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={18} /> View Live
                  </a>
                  <a
                    href={selectedProject.githubUrl}
                    className="px-4 py-3 bg-[#1a1a1a] text-[#c8ff00] rounded-lg border border-[#c8ff00] font-bold uppercase tracking-wide hover:bg-[#c8ff00] hover:text-[#0a0a0a] transition-all flex items-center justify-center gap-2"
                  >
                    <Code size={18} /> GitHub
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default PortfolioPage;
