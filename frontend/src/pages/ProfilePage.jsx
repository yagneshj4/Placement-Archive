import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { motion } from 'framer-motion'
import {
  UserCircleIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  CameraIcon,
  CheckIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../services/api'

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    college: user?.college || '',
    graduationYear: user?.graduationYear || new Date().getFullYear(),
    branch: user?.branch || '',
    linkedinUrl: user?.linkedinUrl || '',
    githubUrl: user?.githubUrl || ''
  })

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await api.put('/auth/profile', formData)
      setUser(response.data.user)
      setEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      college: user?.college || '',
      graduationYear: user?.graduationYear || new Date().getFullYear(),
      branch: user?.branch || '',
      linkedinUrl: user?.linkedinUrl || '',
      githubUrl: user?.githubUrl || ''
    })
    setEditing(false)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">My Profile</h1>

      <div className="grid gap-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                {user?.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={user.name} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-gray-800 rounded-full border border-gray-600 hover:bg-gray-700 transition-colors">
                <CameraIcon className="h-4 w-4 text-gray-300" />
              </button>
            </div>

            {/* Basic Info */}
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-xl font-bold text-white">{user?.name}</h2>
              <p className="text-gray-400">{user?.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                <span className={`badge ${user?.role === 'senior' ? 'badge-primary' : 'badge-success'}`}>
                  {user?.role === 'senior' ? 'Senior' : 'Junior'}
                </span>
                {user?.isVerified && (
                  <span className="badge bg-green-500/20 text-green-400 flex items-center gap-1">
                    <ShieldCheckIcon className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </div>
            </div>

            {/* Edit Button */}
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <PencilIcon className="h-4 w-4" />
                Edit Profile
              </button>
            )}
          </div>
        </motion.div>

        {/* Profile Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
          
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label flex items-center gap-2">
                  <UserCircleIcon className="h-4 w-4" />
                  Full Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="input"
                  />
                ) : (
                  <p className="text-white py-2">{user?.name || '-'}</p>
                )}
              </div>
              <div>
                <label className="label flex items-center gap-2">
                  <EnvelopeIcon className="h-4 w-4" />
                  Email
                </label>
                <p className="text-white py-2">{user?.email || '-'}</p>
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label flex items-center gap-2">
                  <AcademicCapIcon className="h-4 w-4" />
                  College
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.college}
                    onChange={(e) => updateField('college', e.target.value)}
                    className="input"
                    placeholder="Your college name"
                  />
                ) : (
                  <p className="text-white py-2">{user?.college || '-'}</p>
                )}
              </div>
              <div>
                <label className="label flex items-center gap-2">
                  <BriefcaseIcon className="h-4 w-4" />
                  Branch
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => updateField('branch', e.target.value)}
                    className="input"
                    placeholder="e.g., Computer Science"
                  />
                ) : (
                  <p className="text-white py-2">{user?.branch || '-'}</p>
                )}
              </div>
            </div>

            <div>
              <label className="label">Graduation Year</label>
              {editing ? (
                <select
                  value={formData.graduationYear}
                  onChange={(e) => updateField('graduationYear', parseInt(e.target.value))}
                  className="input w-auto"
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              ) : (
                <p className="text-white py-2">{user?.graduationYear || '-'}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Social Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Social Links</h3>
          
          <div className="grid gap-4">
            <div>
              <label className="label">LinkedIn Profile</label>
              {editing ? (
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => updateField('linkedinUrl', e.target.value)}
                  className="input"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              ) : (
                <p className="text-white py-2">
                  {user?.linkedinUrl ? (
                    <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">
                      {user.linkedinUrl}
                    </a>
                  ) : '-'}
                </p>
              )}
            </div>
            <div>
              <label className="label">GitHub Profile</label>
              {editing ? (
                <input
                  type="url"
                  value={formData.githubUrl}
                  onChange={(e) => updateField('githubUrl', e.target.value)}
                  className="input"
                  placeholder="https://github.com/yourusername"
                />
              ) : (
                <p className="text-white py-2">
                  {user?.githubUrl ? (
                    <a href={user.githubUrl} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">
                      {user.githubUrl}
                    </a>
                  ) : '-'}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Activity Stats</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-800/50 rounded-lg">
              <p className="text-2xl font-bold text-primary-400">{user?.experiencesCount || 0}</p>
              <p className="text-gray-400 text-sm">Experiences Shared</p>
            </div>
            <div className="text-center p-4 bg-gray-800/50 rounded-lg">
              <p className="text-2xl font-bold text-purple-400">{user?.questionsCount || 0}</p>
              <p className="text-gray-400 text-sm">Questions Added</p>
            </div>
            <div className="text-center p-4 bg-gray-800/50 rounded-lg">
              <p className="text-2xl font-bold text-green-400">{user?.queriesCount || 0}</p>
              <p className="text-gray-400 text-sm">AI Queries</p>
            </div>
            <div className="text-center p-4 bg-gray-800/50 rounded-lg">
              <p className="text-2xl font-bold text-pink-400">{user?.likesReceived || 0}</p>
              <p className="text-gray-400 text-sm">Likes Received</p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-end gap-3"
          >
            <button
              onClick={handleCancel}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Account Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Account</h3>
          
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700 transition-colors text-gray-300">
              Change Password
            </button>
            <button className="w-full text-left p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700 transition-colors text-gray-300">
              Download My Data
            </button>
            <button className="w-full text-left p-3 rounded-lg bg-red-900/20 hover:bg-red-900/30 transition-colors text-red-400">
              Delete Account
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
