import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  SparklesIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

const features = [
  {
    icon: AcademicCapIcon,
    title: 'Senior Portal',
    description: 'Seniors share verified interview experiences with structured data - questions, rounds, tips, and more.'
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: 'AI-Powered Q&A',
    description: 'Ask natural language questions and get answers grounded in real campus experiences. No hallucinations.'
  },
  {
    icon: ChartBarIcon,
    title: 'Analytics Dashboard',
    description: 'Company trends, difficulty heatmaps, topic analysis - see the complete placement landscape.'
  },
  {
    icon: ShieldCheckIcon,
    title: 'Campus-Specific',
    description: 'Unlike Glassdoor, this is YOUR campus intelligence. Real data from your seniors, for your preparation.'
  }
]

const stats = [
  { label: 'Interview Experiences', value: '500+' },
  { label: 'Companies Covered', value: '50+' },
  { label: 'Questions Indexed', value: '2,000+' },
  { label: 'Success Stories', value: '300+' }
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <SparklesIcon className="h-8 w-8 text-primary-500" />
            <span className="text-xl font-bold gradient-text">Placement Archive</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="btn-ghost">
              Login
            </Link>
            <Link to="/register" className="btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-8">
              <SparklesIcon className="h-5 w-5 text-primary-400" />
              <span className="text-sm text-primary-300">AI-Powered Campus Intelligence</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="text-white">Your Interview Pain</span>
              <br />
              <span className="gradient-text">Becomes Someone's Gain</span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              Stop wasting 15+ hours searching unreliable placement info. 
              Access AI-powered insights from verified senior experiences.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn-primary text-lg px-8 py-3 flex items-center gap-2">
                Start Preparing
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
              <Link to="/register?role=senior" className="btn-secondary text-lg px-8 py-3">
                Share Your Experience
              </Link>
            </div>
          </motion.div>

          {/* Demo preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent z-10" />
            <div className="glass rounded-2xl p-4 max-w-4xl mx-auto">
              <div className="bg-gray-900 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-800">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
                      <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-300 mb-4">
                        "What DSA questions are commonly asked in Amazon interviews?"
                      </p>
                      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <p className="text-white mb-2">
                          <strong>Based on 23 campus experiences:</strong>
                        </p>
                        <ul className="text-gray-300 space-y-1 text-sm">
                          <li>• Two Sum variations (15 mentions)</li>
                          <li>• Binary Tree traversals (12 mentions)</li>
                          <li>• Dynamic Programming - LCS, Knapsack (10 mentions)</li>
                          <li>• Graph - BFS/DFS problems (8 mentions)</li>
                        </ul>
                        <p className="text-primary-400 text-sm mt-3">
                          📚 Sources: 5 verified experiences from 2024-2025
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 border-y border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl font-bold gradient-text mb-1">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Built for Real Results
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Every feature designed to maximize your placement preparation efficiency
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-2xl p-6 card-hover"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Seniors Share',
                description: 'Verified seniors submit their interview experiences with structured details'
              },
              {
                step: '02',
                title: 'AI Processes',
                description: 'Our RAG pipeline converts experiences into searchable embeddings'
              },
              {
                step: '03',
                title: 'Juniors Learn',
                description: 'Ask questions and get AI-powered answers grounded in real data'
              }
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-6xl font-bold text-primary-600/30 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-12 relative overflow-hidden"
          >
            <div className="absolute inset-0 animated-bg opacity-20" />
            <div className="relative">
              <RocketLaunchIcon className="h-16 w-16 text-primary-400 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Ace Your Interviews?
              </h2>
              <p className="text-gray-300 mb-8 max-w-lg mx-auto">
                Join hundreds of students using campus-specific intelligence to prepare smarter.
              </p>
              <Link to="/register" className="btn-primary text-lg px-8 py-3">
                Get Started Free
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-6 w-6 text-primary-500" />
            <span className="font-semibold text-white">Placement Archive</span>
          </div>
          <p className="text-gray-400 text-sm">
            Built with ❤️ for hackathon. © 2024
          </p>
        </div>
      </footer>
    </div>
  )
}
