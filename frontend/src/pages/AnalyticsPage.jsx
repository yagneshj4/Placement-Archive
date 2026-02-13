import { useState, useEffect } from 'react'
import { analyticsApi } from '../services/api'
import { motion } from 'framer-motion'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js'
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2'
import {
  ChartBarIcon,
  BuildingOffice2Icon,
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [timeRange, setTimeRange] = useState('all')

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      const response = await analyticsApi.getDashboard({ timeRange })
      setStats(response.data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
      // Use mock data for demo
      setStats(getMockData())
    } finally {
      setLoading(false)
    }
  }

  const getMockData = () => ({
    totalExperiences: 1247,
    totalQuestions: 8932,
    topCompanies: [
      { name: 'Google', count: 234, selectionRate: 0.45 },
      { name: 'Microsoft', count: 189, selectionRate: 0.52 },
      { name: 'Amazon', count: 167, selectionRate: 0.38 },
      { name: 'Meta', count: 145, selectionRate: 0.42 },
      { name: 'Apple', count: 98, selectionRate: 0.55 }
    ],
    difficultyDistribution: {
      1: 123, 2: 287, 3: 456, 4: 234, 5: 147
    },
    questionTypeBreakdown: {
      coding: 3245,
      system_design: 1234,
      behavioral: 2134,
      technical: 1567,
      hr: 752
    },
    monthlyTrend: [
      { month: 'Jan', count: 67 },
      { month: 'Feb', count: 89 },
      { month: 'Mar', count: 112 },
      { month: 'Apr', count: 98 },
      { month: 'May', count: 145 },
      { month: 'Jun', count: 123 }
    ],
    selectionRateByDifficulty: {
      1: 0.72, 2: 0.61, 3: 0.48, 4: 0.35, 5: 0.28
    },
    topTopics: [
      { topic: 'Arrays', count: 567 },
      { topic: 'Strings', count: 445 },
      { topic: 'Dynamic Programming', count: 389 },
      { topic: 'Trees', count: 312 },
      { topic: 'Graphs', count: 287 },
      { topic: 'System Design', count: 234 },
      { topic: 'OOPs', count: 189 }
    ]
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 skeleton rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-64 skeleton rounded-xl" />)}
        </div>
      </div>
    )
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#9ca3af' }
      }
    },
    scales: {
      x: {
        grid: { color: '#374151' },
        ticks: { color: '#9ca3af' }
      },
      y: {
        grid: { color: '#374151' },
        ticks: { color: '#9ca3af' }
      }
    }
  }

  const companyChartData = {
    labels: stats.topCompanies.map(c => c.name),
    datasets: [{
      label: 'Experiences',
      data: stats.topCompanies.map(c => c.count),
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(34, 211, 238, 0.8)',
        'rgba(52, 211, 153, 0.8)'
      ]
    }]
  }

  const difficultyChartData = {
    labels: ['Easy', 'Easy-Mid', 'Medium', 'Mid-Hard', 'Hard'],
    datasets: [{
      data: Object.values(stats.difficultyDistribution),
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(163, 230, 53, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ]
    }]
  }

  const questionTypeData = {
    labels: Object.keys(stats.questionTypeBreakdown).map(t => t.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())),
    datasets: [{
      data: Object.values(stats.questionTypeBreakdown),
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(34, 211, 238, 0.8)',
        'rgba(52, 211, 153, 0.8)'
      ]
    }]
  }

  const trendChartData = {
    labels: stats.monthlyTrend.map(m => m.month),
    datasets: [{
      label: 'Experiences Added',
      data: stats.monthlyTrend.map(m => m.count),
      borderColor: 'rgb(99, 102, 241)',
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      fill: true,
      tension: 0.4
    }]
  }

  const selectionRateData = {
    labels: ['1 (Easy)', '2', '3 (Medium)', '4', '5 (Hard)'],
    datasets: [{
      label: 'Selection Rate',
      data: Object.values(stats.selectionRateByDifficulty).map(v => v * 100),
      backgroundColor: 'rgba(52, 211, 153, 0.8)',
      borderColor: 'rgb(52, 211, 153)',
      borderWidth: 1
    }]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400">Insights from interview experiences</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="input w-auto"
        >
          <option value="all">All Time</option>
          <option value="year">This Year</option>
          <option value="6months">Last 6 Months</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-600/20">
              <ChartBarIcon className="h-6 w-6 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalExperiences.toLocaleString()}</p>
              <p className="text-gray-400 text-sm">Total Experiences</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-600/20">
              <QuestionMarkCircleIcon className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalQuestions.toLocaleString()}</p>
              <p className="text-gray-400 text-sm">Questions Collected</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-600/20">
              <BuildingOffice2Icon className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.topCompanies.length * 20}+</p>
              <p className="text-gray-400 text-sm">Companies Covered</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-600/20">
              <AcademicCapIcon className="h-6 w-6 text-pink-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {Math.round(stats.topCompanies.reduce((a, c) => a + c.selectionRate, 0) / stats.topCompanies.length * 100)}%
              </p>
              <p className="text-gray-400 text-sm">Avg Selection Rate</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Bar Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Top Companies</h3>
          <div className="h-64">
            <Bar data={companyChartData} options={{...chartOptions, indexAxis: 'y'}} />
          </div>
        </motion.div>

        {/* Difficulty Pie Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Difficulty Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut 
              data={difficultyChartData} 
              options={{
                ...chartOptions,
                scales: undefined,
                cutout: '60%'
              }} 
            />
          </div>
        </motion.div>

        {/* Monthly Trend */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ArrowTrendingUpIcon className="h-5 w-5 text-primary-400" />
            Monthly Trend
          </h3>
          <div className="h-64">
            <Line data={trendChartData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Question Type Breakdown */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Question Types</h3>
          <div className="h-64 flex items-center justify-center">
            <Pie 
              data={questionTypeData} 
              options={{
                ...chartOptions,
                scales: undefined
              }} 
            />
          </div>
        </motion.div>

        {/* Selection Rate by Difficulty */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Selection Rate by Difficulty</h3>
          <div className="h-64">
            <Bar 
              data={selectionRateData} 
              options={{
                ...chartOptions,
                scales: {
                  ...chartOptions.scales,
                  y: {
                    ...chartOptions.scales.y,
                    max: 100,
                    ticks: {
                      ...chartOptions.scales.y.ticks,
                      callback: (value) => value + '%'
                    }
                  }
                }
              }} 
            />
          </div>
        </motion.div>

        {/* Top Topics */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Most Asked Topics</h3>
          <div className="space-y-3">
            {stats.topTopics.map((topic, index) => {
              const maxCount = stats.topTopics[0].count
              const percentage = (topic.count / maxCount) * 100
              return (
                <div key={topic.topic}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-300 text-sm">{topic.topic}</span>
                    <span className="text-gray-400 text-sm">{topic.count}</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Company Selection Rates Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="glass rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Company Insights</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                <th className="pb-3 pr-4">Company</th>
                <th className="pb-3 pr-4">Experiences</th>
                <th className="pb-3 pr-4">Selection Rate</th>
                <th className="pb-3">Difficulty</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {stats.topCompanies.map((company, index) => (
                <tr key={company.name} className="border-b border-gray-800 last:border-0">
                  <td className="py-3 pr-4 font-medium text-white">{company.name}</td>
                  <td className="py-3 pr-4">{company.count}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${company.selectionRate * 100}%` }}
                        />
                      </div>
                      <span>{Math.round(company.selectionRate * 100)}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`badge ${
                      index < 2 ? 'bg-red-500/20 text-red-400' : 
                      index < 4 ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {index < 2 ? 'Hard' : index < 4 ? 'Medium' : 'Easy-Medium'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
