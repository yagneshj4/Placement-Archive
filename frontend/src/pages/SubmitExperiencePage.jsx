import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { experienceApi } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const ROUND_TYPES = ['online_assessment', 'technical', 'hr', 'managerial', 'group_discussion', 'other']
const QUESTION_TYPES = ['coding', 'system_design', 'behavioral', 'technical', 'hr', 'puzzle', 'other']
const OFFER_STATUSES = ['selected', 'rejected', 'waitlisted', 'pending']

export default function SubmitExperiencePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    companyName: '',
    role: '',
    interviewYear: new Date().getFullYear(),
    difficultyLevel: 3,
    offerStatus: 'selected',
    overallExp: 'neutral',
    tips: '',
    isAnonymous: false,
    resourcesUsed: []
  })

  const [rounds, setRounds] = useState([
    { roundNumber: 1, roundType: 'online_assessment', roundName: '', description: '', durationMinutes: 60, mode: 'online', questions: [] }
  ])

  const [resourceInput, setResourceInput] = useState('')

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addRound = () => {
    setRounds(prev => [
      ...prev,
      { roundNumber: prev.length + 1, roundType: 'technical', roundName: '', description: '', durationMinutes: 60, mode: 'online', questions: [] }
    ])
  }

  const updateRound = (index, field, value) => {
    setRounds(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
  }

  const removeRound = (index) => {
    if (rounds.length > 1) {
      setRounds(prev => prev.filter((_, i) => i !== index).map((r, i) => ({ ...r, roundNumber: i + 1 })))
    }
  }

  const addQuestion = (roundIndex) => {
    setRounds(prev => prev.map((r, i) => {
      if (i === roundIndex) {
        return {
          ...r,
          questions: [...r.questions, { questionText: '', questionType: 'coding', topic: '', difficulty: 3, answerApproach: '' }]
        }
      }
      return r
    }))
  }

  const updateQuestion = (roundIndex, questionIndex, field, value) => {
    setRounds(prev => prev.map((r, ri) => {
      if (ri === roundIndex) {
        return {
          ...r,
          questions: r.questions.map((q, qi) => qi === questionIndex ? { ...q, [field]: value } : q)
        }
      }
      return r
    }))
  }

  const removeQuestion = (roundIndex, questionIndex) => {
    setRounds(prev => prev.map((r, ri) => {
      if (ri === roundIndex) {
        return {
          ...r,
          questions: r.questions.filter((_, qi) => qi !== questionIndex)
        }
      }
      return r
    }))
  }

  const addResource = () => {
    if (resourceInput.trim() && !formData.resourcesUsed.includes(resourceInput.trim())) {
      updateFormData('resourcesUsed', [...formData.resourcesUsed, resourceInput.trim()])
      setResourceInput('')
    }
  }

  const removeResource = (index) => {
    updateFormData('resourcesUsed', formData.resourcesUsed.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!formData.companyName || !formData.role) {
      toast.error('Please fill in company name and role')
      setStep(1)
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        rounds: rounds.map(r => ({
          ...r,
          questions: r.questions.filter(q => q.questionText.trim())
        })).filter(r => r.roundType)
      }
      
      await experienceApi.create(payload)
      toast.success('Experience submitted successfully!')
      navigate('/experiences')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit experience')
    } finally {
      setSubmitting(false)
    }
  }

  const steps = ['Basic Info', 'Interview Rounds', 'Tips & Resources', 'Review']

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Share Your Experience</h1>
      <p className="text-gray-400 mb-8">Help juniors prepare by sharing your interview experience</p>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((stepName, index) => (
          <div key={stepName} className="flex items-center">
            <div className={`flex items-center gap-2 ${step > index + 1 ? 'text-green-400' : step === index + 1 ? 'text-primary-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step > index + 1 ? 'bg-green-500 border-green-500' :
                step === index + 1 ? 'border-primary-500 bg-primary-500/20' : 'border-gray-600'
              }`}>
                {step > index + 1 ? <CheckIcon className="h-5 w-5 text-white" /> : index + 1}
              </div>
              <span className="hidden sm:inline text-sm">{stepName}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 sm:w-20 h-0.5 mx-2 ${step > index + 1 ? 'bg-green-500' : 'bg-gray-700'}`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass rounded-xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Company Name *</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => updateFormData('companyName', e.target.value)}
                    className="input"
                    placeholder="e.g., Google"
                  />
                </div>
                <div>
                  <label className="label">Role *</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => updateFormData('role', e.target.value)}
                    className="input"
                    placeholder="e.g., Software Engineer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Interview Year</label>
                  <input
                    type="number"
                    value={formData.interviewYear}
                    onChange={(e) => updateFormData('interviewYear', parseInt(e.target.value))}
                    className="input"
                    min="2020"
                    max={new Date().getFullYear()}
                  />
                </div>
                <div>
                  <label className="label">Offer Status</label>
                  <select
                    value={formData.offerStatus}
                    onChange={(e) => updateFormData('offerStatus', e.target.value)}
                    className="input"
                  >
                    {OFFER_STATUSES.map(status => (
                      <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Overall Difficulty</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      onClick={() => updateFormData('difficultyLevel', level)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        formData.difficultyLevel === level
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                  <span className="text-gray-500 text-sm ml-2">
                    {formData.difficultyLevel <= 2 ? 'Easy' : formData.difficultyLevel === 3 ? 'Medium' : 'Hard'}
                  </span>
                </div>
              </div>

              <div>
                <label className="label">Overall Experience</label>
                <div className="flex gap-2">
                  {['positive', 'neutral', 'negative'].map(exp => (
                    <button
                      key={exp}
                      onClick={() => updateFormData('overallExp', exp)}
                      className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                        formData.overallExp === exp
                          ? exp === 'positive' ? 'bg-green-600 text-white' :
                            exp === 'negative' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {exp}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={formData.isAnonymous}
                  onChange={(e) => updateFormData('isAnonymous', e.target.checked)}
                  className="w-5 h-5 rounded bg-gray-800 border-gray-600 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="anonymous" className="text-gray-300">
                  Submit anonymously (your name won't be shown)
                </label>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Interview Rounds */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {rounds.map((round, roundIndex) => (
              <div key={roundIndex} className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Round {round.roundNumber}</h3>
                  {rounds.length > 1 && (
                    <button
                      onClick={() => removeRound(roundIndex)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="label">Round Type</label>
                    <select
                      value={round.roundType}
                      onChange={(e) => updateRound(roundIndex, 'roundType', e.target.value)}
                      className="input"
                    >
                      {ROUND_TYPES.map(type => (
                        <option key={type} value={type}>
                          {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Duration (minutes)</label>
                    <input
                      type="number"
                      value={round.durationMinutes}
                      onChange={(e) => updateRound(roundIndex, 'durationMinutes', parseInt(e.target.value))}
                      className="input"
                      min="5"
                      max="300"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="label">Description</label>
                  <textarea
                    value={round.description}
                    onChange={(e) => updateRound(roundIndex, 'description', e.target.value)}
                    className="input min-h-[80px]"
                    placeholder="Describe what happened in this round..."
                  />
                </div>

                {/* Questions for this round */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">Questions Asked</p>
                    <button
                      onClick={() => addQuestion(roundIndex)}
                      className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Question
                    </button>
                  </div>

                  {round.questions.map((question, qIndex) => (
                    <div key={qIndex} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            value={question.questionText}
                            onChange={(e) => updateQuestion(roundIndex, qIndex, 'questionText', e.target.value)}
                            className="input"
                            placeholder="Enter question..."
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <select
                              value={question.questionType}
                              onChange={(e) => updateQuestion(roundIndex, qIndex, 'questionType', e.target.value)}
                              className="input text-sm"
                            >
                              {QUESTION_TYPES.map(type => (
                                <option key={type} value={type}>
                                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={question.topic}
                              onChange={(e) => updateQuestion(roundIndex, qIndex, 'topic', e.target.value)}
                              className="input text-sm"
                              placeholder="Topic (e.g., Arrays)"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removeQuestion(roundIndex, qIndex)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={addRound}
              className="w-full py-3 border-2 border-dashed border-gray-600 rounded-xl text-gray-400 hover:text-white hover:border-primary-500 transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add Another Round
            </button>
          </motion.div>
        )}

        {/* Step 3: Tips & Resources */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass rounded-xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Tips & Resources</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Preparation Tips</label>
                <textarea
                  value={formData.tips}
                  onChange={(e) => updateFormData('tips', e.target.value)}
                  className="input min-h-[150px]"
                  placeholder="Share tips that helped you prepare for this interview..."
                />
              </div>

              <div>
                <label className="label">Resources Used</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={resourceInput}
                    onChange={(e) => setResourceInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addResource())}
                    className="input flex-1"
                    placeholder="e.g., LeetCode, CTCI, etc."
                  />
                  <button onClick={addResource} className="btn-primary px-4">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.resourcesUsed.map((resource, index) => (
                    <span
                      key={index}
                      className="badge bg-gray-700 text-gray-300 flex items-center gap-1"
                    >
                      {resource}
                      <button onClick={() => removeResource(index)} className="hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass rounded-xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Review Your Experience</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <p className="text-gray-400 text-sm">Company</p>
                  <p className="text-white font-medium">{formData.companyName || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Role</p>
                  <p className="text-white font-medium">{formData.role || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Year</p>
                  <p className="text-white">{formData.interviewYear}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <p className="text-white capitalize">{formData.offerStatus}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Difficulty</p>
                  <p className="text-white">{formData.difficultyLevel}/5</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Anonymous</p>
                  <p className="text-white">{formData.isAnonymous ? 'Yes' : 'No'}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-gray-400 text-sm mb-1">Interview Rounds</p>
                <p className="text-white">{rounds.length} round(s) with {rounds.reduce((acc, r) => acc + r.questions.length, 0)} question(s)</p>
              </div>

              {formData.tips && (
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Tips</p>
                  <p className="text-gray-300 text-sm line-clamp-3">{formData.tips}</p>
                </div>
              )}

              {formData.resourcesUsed.length > 0 && (
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">Resources</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.resourcesUsed.map((r, i) => (
                      <span key={i} className="badge bg-gray-700 text-gray-300">{r}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Previous
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            className="btn-primary flex items-center gap-2"
          >
            Next
            <ArrowRightIcon className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                Submitting...
              </>
            ) : (
              <>
                <CheckIcon className="h-5 w-5" />
                Submit Experience
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
