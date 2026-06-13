'use client';
import React, { useState } from 'react';
import {
  ChevronDown, CheckCircle, Clock, XCircle, MessageSquare, Eye, Play,
  Plus, Edit2, Trash2, MoreVertical, Filter, Search, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ===== MANAGER DASHBOARD =====
export const ManagerDashboard = ({ manager }) => {
  const [expandedProject, setExpandedProject] = useState(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const projects = [
    {
      id: 1,
      title: 'E-Commerce Platform Redesign',
      description: 'Modernize our online store with React and improved UX',
      pay: 'Paid',
      payAmount: '$15,000',
      timeline: '8 weeks',
      skills: ['React', 'Node.js', 'Figma', 'PostgreSQL'],
      visibility: 'Public',
      submissions: [
        {
          id: 'sub1',
          candidateName: 'Priya Sharma',
          candidateTitle: 'Full Stack Engineer',
          candidateImage: 'https://via.placeholder.com/100',
          status: 'pending',
          submittedDate: '2024-06-10',
          workUrl: 'https://github.com/example',
          videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
          note: 'Built a component library and integrated with existing backend. Ready for code review.',
          rating: null,
        },
        {
          id: 'sub2',
          candidateName: 'Alex Chen',
          candidateTitle: 'Product Designer',
          candidateImage: 'https://via.placeholder.com/100/ff006e/0a0a0a',
          status: 'accepted',
          submittedDate: '2024-06-08',
          workUrl: 'https://figma.com/example',
          videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
          note: 'Delivered comprehensive design system with 50+ components',
          rating: 5,
        },
        {
          id: 'sub3',
          candidateName: 'Jordan Williams',
          candidateTitle: 'Growth Marketing Manager',
          candidateImage: 'https://via.placeholder.com/100/00f5ff/0a0a0a',
          status: 'rejected',
          submittedDate: '2024-06-09',
          workUrl: 'https://example.com',
          videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
          note: 'Not a good fit for this technical role',
          rating: null,
        },
      ],
    },
    {
      id: 2,
      title: 'Mobile App Development',
      description: 'Build iOS app for fitness tracking',
      pay: 'Paid',
      payAmount: '$25,000',
      timeline: '12 weeks',
      skills: ['Swift', 'CoreML', 'Firebase'],
      visibility: 'Public',
      submissions: [
        {
          id: 'sub4',
          candidateName: 'Casey Rivera',
          candidateTitle: 'iOS Developer',
          candidateImage: 'https://via.placeholder.com/100',
          status: 'pending',
          submittedDate: '2024-06-11',
          workUrl: 'https://github.com/example',
          videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
          note: 'Submitted complete prototype with all core features',
          rating: null,
        },
      ],
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-[#c8ff00] bg-[#1a1a1a] border-[#c8ff00]';
      case 'accepted':
        return 'text-[#00f5ff] bg-[#1a1a1a] border-[#00f5ff]';
      case 'rejected':
        return 'text-[#ff006e] bg-[#1a1a1a] border-[#ff006e]';
      default:
        return 'text-[#2d2d2d] bg-[#1a1a1a] border-[#2d2d2d]';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} />;
      case 'accepted':
        return <CheckCircle size={16} />;
      case 'rejected':
        return <XCircle size={16} />;
      default:
        return null;
    }
  };

  const totalSubmissions = projects.reduce((sum, p) => sum + p.submissions.length, 0);
  const pendingSubmissions = projects.reduce(
    (sum, p) => sum + p.submissions.filter(s => s.status === 'pending').length,
    0
  );

  return (
    <div className="bg-[#0a0a0a] text-[#f0ece4] min-h-screen">
      {/* ===== HEADER ===== */}
      <motion.header
        className="sticky top-0 z-40 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-[#2d2d2d] py-6 px-6 md:px-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Manager Profile Section */}
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Mono' }}>
                Dashboard
              </h1>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#c8ff00] to-[#ff006e] rounded-lg" />
                <div>
                  <p className="font-bold">{manager.company}</p>
                  <p className="text-xs text-[#2d2d2d] font-mono">{manager.role}</p>
                </div>
              </div>
            </div>

            <motion.button
              onClick={() => setShowNewProjectModal(true)}
              className="px-6 py-3 bg-[#c8ff00] text-[#0a0a0a] rounded-lg font-bold uppercase tracking-wide flex items-center gap-2 hover:scale-105 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={20} /> New Project
            </motion.button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Active Projects', value: projects.length, icon: Users },
              { label: 'Total Submissions', value: totalSubmissions, icon: CheckCircle },
              { label: 'Pending Review', value: pendingSubmissions, icon: Clock },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="p-4 bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg flex items-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="p-2 bg-[#0a0a0a] rounded-lg">
                  <stat.icon className="w-5 h-5 text-[#c8ff00]" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#2d2d2d]">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.header>

      {/* ===== PROJECTS & SUBMISSIONS ===== */}
      <section className="py-12 px-6 md:px-16">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Section Header */}
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl font-bold" style={{ fontFamily: 'Space Mono' }}>
              Projects & Submissions
            </h2>

            {/* Filters */}
            <div className="flex gap-2">
              {['all', 'pending', 'accepted', 'rejected'].map((status) => (
                <motion.button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wide transition-all ${
                    filterStatus === status
                      ? 'bg-[#c8ff00] text-[#0a0a0a]'
                      : 'bg-[#1a1a1a] text-[#2d2d2d] border border-[#2d2d2d] hover:border-[#c8ff00]'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {status}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Projects List */}
          <div className="space-y-6">
            {projects.map((project, idx) => (
              <motion.div
                key={project.id}
                className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                {/* Project Header */}
                <motion.button
                  onClick={() =>
                    setExpandedProject(expandedProject === project.id ? null : project.id)
                  }
                  className="w-full p-6 flex items-center justify-between hover:bg-[#2d2d2d]/50 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#c8ff00] to-[#ff006e] flex-shrink-0" />

                    <div className="flex-1">
                      <h3 className="text-xl font-bold group-hover:text-[#c8ff00] transition-colors">
                        {project.title}
                      </h3>
                      <div className="flex gap-3 mt-2 flex-wrap">
                        <span className="text-xs px-2 py-1 bg-[#0a0a0a] text-[#c8ff00] rounded-full font-mono border border-[#c8ff00]">
                          {project.pay}
                        </span>
                        <span className="text-xs px-2 py-1 bg-[#0a0a0a] text-[#00f5ff] rounded-full font-mono border border-[#00f5ff]">
                          {project.timeline}
                        </span>
                        <span className="text-xs px-2 py-1 bg-[#0a0a0a] text-[#2d2d2d] rounded-full font-mono">
                          {project.submissions.length} submissions
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-2xl font-bold text-[#c8ff00]">{project.submissions.length}</p>
                      <p className="text-xs text-[#2d2d2d] font-mono">submissions</p>
                    </div>

                    <motion.div
                      animate={{ rotate: expandedProject === project.id ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown size={24} className="text-[#2d2d2d]" />
                    </motion.div>
                  </div>
                </motion.button>

                {/* Submissions List (Expandable) */}
                <AnimatePresence>
                  {expandedProject === project.id && (
                    <motion.div
                      className="border-t border-[#2d2d2d] p-6 space-y-4"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {project.submissions.map((submission) => (
                        <motion.div
                          key={submission.id}
                          className="bg-[#0a0a0a] border border-[#2d2d2d] rounded-lg p-4 hover:border-[#c8ff00]/50 transition-all cursor-pointer group"
                          onClick={() => setSelectedSubmission(submission)}
                          whileHover={{ x: 4 }}
                        >
                          <div className="flex items-start justify-between">
                            {/* Candidate Info */}
                            <div className="flex gap-4 flex-1">
                              <img
                                src={submission.candidateImage}
                                alt={submission.candidateName}
                                className="w-12 h-12 rounded-lg"
                              />

                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold group-hover:text-[#c8ff00] transition-colors">
                                    {submission.candidateName}
                                  </h4>
                                  <span
                                    className={`px-2 py-1 text-xs font-mono rounded-full border flex items-center gap-1 ${getStatusColor(
                                      submission.status
                                    )}`}
                                  >
                                    {getStatusIcon(submission.status)}
                                    {submission.status}
                                  </span>
                                </div>

                                <p className="text-xs text-[#2d2d2d] font-mono mb-2">
                                  {submission.candidateTitle} • {submission.submittedDate}
                                </p>

                                <p className="text-sm text-[#2d2d2d] line-clamp-2">
                                  {submission.note}
                                </p>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 ml-4">
                              <motion.button
                                className="p-2 bg-[#1a1a1a] text-[#00f5ff] rounded-lg hover:bg-[#00f5ff] hover:text-[#0a0a0a] transition-all"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Eye size={18} />
                              </motion.button>
                              <motion.button
                                className="p-2 bg-[#1a1a1a] text-[#c8ff00] rounded-lg hover:bg-[#c8ff00] hover:text-[#0a0a0a] transition-all"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Play size={18} />
                              </motion.button>
                              <motion.button
                                className="p-2 bg-[#1a1a1a] text-[#2d2d2d] rounded-lg hover:text-[#c8ff00] transition-all"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <MoreVertical size={18} />
                              </motion.button>
                            </div>
                          </div>

                          {/* Work Links */}
                          {submission.status === 'pending' && (
                            <div className="flex gap-2 mt-4 pt-4 border-t border-[#2d2d2d]">
                              <motion.button
                                className="flex-1 px-3 py-2 bg-[#c8ff00] text-[#0a0a0a] rounded-lg font-bold text-xs uppercase tracking-wide hover:scale-105 transition-all"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Accept
                              </motion.button>
                              <motion.button
                                className="flex-1 px-3 py-2 bg-[#ff006e] text-white rounded-lg font-bold text-xs uppercase tracking-wide hover:scale-105 transition-all"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Reject
                              </motion.button>
                              <motion.button
                                className="flex-1 px-3 py-2 bg-[#1a1a1a] text-[#00f5ff] rounded-lg border border-[#00f5ff] font-bold text-xs uppercase tracking-wide hover:bg-[#00f5ff] hover:text-[#0a0a0a] transition-all"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Message
                              </motion.button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Project Footer (Edit/Delete) */}
                <div className="bg-[#0a0a0a] border-t border-[#2d2d2d] px-6 py-4 flex justify-end gap-3">
                  <motion.button
                    className="px-4 py-2 bg-[#1a1a1a] text-[#00f5ff] rounded-lg border border-[#00f5ff] font-mono text-sm uppercase tracking-wide hover:bg-[#00f5ff] hover:text-[#0a0a0a] transition-all flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Edit2 size={16} /> Edit
                  </motion.button>
                  <motion.button
                    className="px-4 py-2 bg-[#1a1a1a] text-[#ff006e] rounded-lg border border-[#ff006e] font-mono text-sm uppercase tracking-wide hover:bg-[#ff006e] hover:text-[#0a0a0a] transition-all flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Trash2 size={16} /> Delete
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ManagerDashboard;
