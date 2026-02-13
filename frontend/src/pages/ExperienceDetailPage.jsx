import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { experienceApi } from '../services/api'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  HeartIcon,
  BookmarkIcon,
  ShareIcon,
  FlagIcon,
  ClockIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

export default function ExperienceDetailPage() {
  const { id } = useParams()
  const [experience, setExperience] = useState(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)

  useEffect(() => {
    loadExperience()
  }, [id])

  const loadExperience = async () => {
    try {
      const response = await experienceApi.getById(id)
      setExperience(response.data.experience)
      setLiked(response.data.experience.isLiked)
      setBookmarked(response.data.experience.isBookmarked)
    } catch (error) {
      console.error('Failed to load experience:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    try {
      const response = await experienceApi.like(id)
      setLiked(response.data.liked)
      toast.success(response.data.liked ? 'Liked!' : 'Like removed')
    } catch (error) {
      toast.error('Failed to like')
    }
  }

  const handleBookmark = async () => {
    try {
      const response = await experienceApi.bookmark(id)
      setBookmarked(response.data.bookmarked)
      toast.success(response.data.bookmarked ? 'Bookmarked!' : 'Bookmark removed')
    } catch (error) {
      toast.error('Failed to bookmark')
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-10 w-32 skeleton rounded" />
        <div className="h-40 skeleton rounded-xl" />
        <div className="h-60 skeleton rounded-xl" />
      </div>
    )
  }

  if (!experience) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Experience not found</p>
        <Link to="/experiences" className="text-primary-400 mt-4 inline-block">
          Back to experiences
        </Link>
      </div>
    )
  }

  const getDifficultyInfo = (level) => {
    if (!level) return { label: 'Unknown', color: 'text-gray-400', bg: 'bg-gray-500/20' }
    const info = [
      { label: 'Easy', color: 'text-green-400', bg: 'bg-green-500/20' },
      { label: 'Easy-Medium', color: 'text-lime-400', bg: 'bg-lime-500/20' },
      { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
      { label: 'Medium-Hard', color: 'text-orange-400', bg: 'bg-orange-500/20' },
      { label: 'Hard', color: 'text-red-400', bg: 'bg-red-500/20' }
    ]
    return info[level - 1] || info[2]
  }

  const difficultyInfo = getDifficultyInfo(experience.difficultyLevel)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        to="/experiences"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        Back to experiences
      </Link>

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 mb-6"
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{experience.companyName}</h1>
              <span className={`badge ${
                experience.offerStatus === 'selected' ? 'badge-success' :
                experience.offerStatus === 'rejected' ? 'badge-error' : 'badge-warning'
              }`}>
                {experience.offerStatus === 'selected' && <CheckCircleIcon className="h-4 w-4 mr-1" />}
                {experience.offerStatus === 'rejected' && <XCircleIcon className="h-4 w-4 mr-1" />}
                {experience.offerStatus}
              </span>
            </div>
            <p className="text-lg text-gray-300">{experience.role}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
              <span>{experience.interviewYear}</span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded ${difficultyInfo.bg} ${difficultyInfo.color}`}>
                {difficultyInfo.label}
              </span>
              {experience.overallExp && (
                <>
                  <span>•</span>
                  <span className="capitalize">{experience.overallExp} experience</span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              className={`p-3 rounded-lg ${liked ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-400 hover:text-red-400'} transition-colors`}
            >
              {liked ? <HeartSolidIcon className="h-5 w-5" /> : <HeartIcon className="h-5 w-5" />}
            </button>
            <button
              onClick={handleBookmark}
              className={`p-3 rounded-lg ${bookmarked ? 'bg-primary-500/20 text-primary-400' : 'bg-gray-800 text-gray-400 hover:text-primary-400'} transition-colors`}
            >
              {bookmarked ? <BookmarkSolidIcon className="h-5 w-5" /> : <BookmarkIcon className="h-5 w-5" />}
            </button>
            <button
              onClick={handleShare}
              className="p-3 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <ShareIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Author Info */}
        {!experience.isAnonymous && experience.user && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-700">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="text-white font-medium">
                {experience.user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white font-medium">{experience.user.name}</p>
              <p className="text-sm text-gray-400">{experience.user.college}</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Tips Section */}
      {experience.tips && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-white mb-3">Preparation Tips</h2>
          <p className="text-gray-300 whitespace-pre-wrap">{experience.tips}</p>
        </motion.div>
      )}

      {/* Interview Rounds */}
      {experience.rounds && experience.rounds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Interview Rounds</h2>
          <div className="space-y-4">
            {experience.rounds.map((round, index) => (
              <div
                key={round.id || index}
                className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                      {round.roundNumber}
                    </span>
                    <div>
                      <h3 className="font-medium text-white capitalize">
                        {round.roundType?.replace('_', ' ')}
                      </h3>
                      {round.roundName && (
                        <p className="text-sm text-gray-400">{round.roundName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    {round.durationMinutes && (
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        {round.durationMinutes} min
                      </span>
                    )}
                    {round.mode && (
                      <span className="badge badge-primary capitalize">{round.mode}</span>
                    )}
                  </div>
                </div>
                {round.description && (
                  <p className="text-gray-300 text-sm mt-2">{round.description}</p>
                )}

                {/* Questions for this round */}
                {round.questions && round.questions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Questions asked:</p>
                    <ul className="space-y-2">
                      {round.questions.map((q, qi) => (
                        <li key={q.id || qi} className="text-sm">
                          <div className="flex items-start gap-2">
                            <span className="text-primary-400">•</span>
                            <div>
                              <p className="text-gray-200">{q.questionText}</p>
                              {q.topic && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Topic: {q.topic} {q.subtopic && `• ${q.subtopic}`}
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* All Questions */}
      {experience.questions && experience.questions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">
            All Questions ({experience.questions.length})
          </h2>
          <div className="space-y-3">
            {experience.questions.map((question, index) => (
              <div
                key={question.id || index}
                className="p-4 bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-white">{question.questionText}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {question.questionType && (
                        <span className="badge badge-primary capitalize">
                          {question.questionType.replace('_', ' ')}
                        </span>
                      )}
                      {question.topic && (
                        <span className="badge bg-gray-700 text-gray-300">
                          {question.topic}
                        </span>
                      )}
                      {question.difficulty && (
                        <span className={`badge ${getDifficultyInfo(question.difficulty).bg} ${getDifficultyInfo(question.difficulty).color}`}>
                          Difficulty: {question.difficulty}/5
                        </span>
                      )}
                    </div>
                    {question.answerApproach && (
                      <div className="mt-3 p-3 bg-gray-900/50 rounded text-sm">
                        <p className="text-gray-400 mb-1">Approach:</p>
                        <p className="text-gray-300">{question.answerApproach}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Resources */}
      {experience.resourcesUsed && experience.resourcesUsed.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-white mb-3">Resources Used</h2>
          <div className="flex flex-wrap gap-2">
            {experience.resourcesUsed.map((resource, index) => (
              <span key={index} className="badge bg-gray-700 text-gray-300">
                {resource}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Report Button */}
      <div className="text-center">
        <button
          onClick={() => toast.success('Report feature coming soon')}
          className="text-gray-500 hover:text-gray-400 text-sm flex items-center gap-1 mx-auto"
        >
          <FlagIcon className="h-4 w-4" />
          Report this experience
        </button>
      </div>
    </div>
  )
}
