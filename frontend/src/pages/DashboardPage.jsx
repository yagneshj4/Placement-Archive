import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { analyticsApi, experienceApi } from '../services/api'
import { motion } from 'framer-motion'
import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  SparklesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [insights, setInsights] = useState([])
  const [recentExperiences, setRecentExperiences] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [statsRes, insightsRes, expRes] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getInsights(),
        experienceApi.getAll({ limit: 5 })
      ])
      
      setStats(statsRes.data)
      setInsights(insightsRes.data.insights)
      setRecentExperiences(expRes.data.experiences)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Ask AI',
      description: 'Get answers from real experiences',
      icon: ChatBubbleLeftRightIcon,
      href: '/ask',
      color: 'from-primary-600 to-primary-700'
    },
    {
      title: 'Browse Experiences',
      description: 'Read full interview experiences',
      icon: DocumentTextIcon,
      href: '/experiences',
      color: 'from-accent-600 to-accent-700'
    },
    {
      title: 'View Analytics',
      description: 'Explore trends and patterns',
      icon: ChartBarIcon,
      href: '/analytics',
      color: 'from-green-600 to-green-700'
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 skeleton rounded-2xl" />
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 skeleton rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 md:p-8 relative overflow-hidden"
      >
        <div className="absolute inset-0 animated-bg opacity-10" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-gray-400">
              {user?.role === 'junior' 
                ? 'Ready to prepare? Ask questions or explore experiences.'
                : 'Share your experiences and help juniors succeed.'}
            </p>
          </div>
          {user?.role === 'junior' && (
            <Link
              to="/ask"
              className="btn-primary flex items-center gap-2 self-start"
            >
              <SparklesIcon className="h-5 w-5" />
              Ask AI Now
            </Link>
          )}
          {user?.role === 'senior' && (
            <Link
              to="/submit"
              className="btn-primary flex items-center gap-2 self-start"
            >
              <DocumentTextIcon className="h-5 w-5" />
              Share Experience
            </Link>
          )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Experiences', value: stats?.totalExperiences || 0, icon: DocumentTextIcon },
          { label: 'Companies', value: stats?.totalCompanies || 0, icon: BuildingOfficeIcon },
          { label: 'Questions', value: stats?.totalQuestions || 0, icon: ChatBubbleLeftRightIcon },
          { label: 'Users', value: stats?.totalUsers || 0, icon: AcademicCapIcon }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-600/20 flex items-center justify-center">
                <stat.icon className="h-5 w-5 text-primary-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={action.href}
                className="block glass rounded-xl p-5 card-hover group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-primary-400 transition-colors">
                  {action.title}
                </h3>
                <p className="text-gray-400 text-sm">{action.description}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ArrowTrendingUpIcon className="h-5 w-5 text-primary-400" />
            Latest Insights
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {insights.slice(0, 4).map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-xl p-4 flex items-start gap-3"
              >
                <span className="text-2xl">{insight.icon || '📊'}</span>
                <div>
                  <p className="text-white">{insight.text}</p>
                  {insight.change && (
                    <span className={`text-sm ${insight.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {insight.change > 0 ? '+' : ''}{insight.change}%
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Experiences */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Experiences</h2>
          <Link to="/experiences" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
            View all <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {recentExperiences.map((exp, i) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={`/experiences/${exp.id}`}
                className="block glass rounded-xl p-4 card-hover"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{exp.companyName}</h3>
                    <p className="text-sm text-gray-400">{exp.role} • {exp.interviewYear}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className={`badge ${
                      exp.offerStatus === 'selected' ? 'badge-success' : 
                      exp.offerStatus === 'rejected' ? 'badge-error' : 'badge-warning'
                    }`}>
                      {exp.offerStatus}
                    </span>
                    <span>{exp._count?.likes || 0} likes</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Upgrade Banner for Juniors */}
      {user?.role === 'junior' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border border-accent-500/30"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Have interview experience to share?
              </h3>
              <p className="text-gray-400 text-sm">
                Upgrade to senior and help juniors with your insights.
              </p>
            </div>
            <UpgradeButton />
          </div>
        </motion.div>
      )}
    </div>
  )
}

function UpgradeButton() {
  const { upgradeToSenior, isLoading } = useAuthStore()
  const [upgraded, setUpgraded] = useState(false)

  const handleUpgrade = async () => {
    const result = await upgradeToSenior()
    if (result.success) {
      setUpgraded(true)
    }
  }

  if (upgraded) {
    return (
      <span className="text-green-400 flex items-center gap-2">
        ✓ Upgraded successfully!
      </span>
    )
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={isLoading}
      className="btn-primary"
    >
      {isLoading ? 'Upgrading...' : 'Upgrade to Senior'}
    </button>
  )
}
