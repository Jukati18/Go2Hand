'use client'

// src/components/profile/EditProfileModal.tsx
// ============================================
// EDIT PROFILE MODAL
//
// Fields:
//   • Avatar — upload image OR keep gradient initials
//   • Display name (full_name)
//   • Bio (max 300 chars)
//   • Location
//
// Flow:
//   1. User selects avatar file → preview it locally
//   2. On save: upload avatar via storageService → get URL
//   3. Call actionUpdateProfile(formData) with all fields
//   4. onSuccess() → parent refreshes profile data
// ============================================

import { useState, useRef, useCallback, ChangeEvent, FormEvent } from 'react'
import Image from 'next/image'
import {
    XMarkIcon,
    CameraIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid'
import { actionUpdateProfile } from '@/actions/profile'
import { uploadAvatar } from '@/services/storageService'
import type { UserProfile } from '@/services/profileService'

// ── Avatar gradient pool ──────────────────────────────────────────
const AVATAR_GRADIENTS = [
    'from-teal-500 to-emerald-500',
    'from-violet-500 to-purple-500',
    'from-orange-500 to-red-500',
    'from-blue-500 to-cyan-500',
    'from-pink-500 to-rose-500',
]
function pickGradient(seed: string) {
    return AVATAR_GRADIENTS[seed.charCodeAt(0) % AVATAR_GRADIENTS.length]
}
function toInitials(name: string) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

interface EditProfileModalProps {
    isOpen: boolean
    profile: UserProfile
    userId: string
    onClose: () => void
    onSuccess: () => void
}

export default function EditProfileModal({
    isOpen,
    profile,
    userId,
    onClose,
    onSuccess,
}: EditProfileModalProps) {
    // ── Form field state ──────────────────────────────────────────
    const [fullName,  setFullName]  = useState(profile.fullName  ?? '')
    const [bio,       setBio]       = useState(profile.bio       ?? '')
    const [location,  setLocation]  = useState(profile.location  ?? '')

    // ── Avatar state ──────────────────────────────────────────────
    const [avatarFile,    setAvatarFile]    = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatarUrl)

    const fileInputRef = useRef<HTMLInputElement>(null)

    // ── Submission state ──────────────────────────────────────────
    const [saving,  setSaving]  = useState(false)
    const [error,   setError]   = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const gradient = pickGradient(userId)
    const displayName = fullName || profile.username
    const initials = toInitials(displayName)
    const bioRemaining = 300 - bio.length

    // ── Handle avatar file pick ───────────────────────────────────
    const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type + size (max 2 MB)
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file.')
            return
        }
        if (file.size > 2 * 1024 * 1024) {
            setError('Avatar must be under 2 MB.')
            return
        }

        setAvatarFile(file)
        setAvatarPreview(URL.createObjectURL(file))
        setError(null)
    }, [])

    // ── Remove avatar ─────────────────────────────────────────────
    const handleRemoveAvatar = useCallback(() => {
        setAvatarFile(null)
        setAvatarPreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }, [])

    // ── Submit ────────────────────────────────────────────────────
    const handleSubmit = useCallback(async (e: FormEvent) => {
        e.preventDefault()
        setError(null)
        setSaving(true)

        try {
            const fd = new FormData()
            fd.set('full_name', fullName.trim())
            fd.set('bio',       bio.trim())
            fd.set('location',  location.trim())

            // Upload avatar if a new file was selected
            if (avatarFile) {
                const url = await uploadAvatar(avatarFile, userId)
                fd.set('avatar_url', url)
            } else if (avatarPreview === null && profile.avatarUrl) {
                // User explicitly removed their avatar
                fd.set('avatar_url', '')
            }

            const result = await actionUpdateProfile(fd)

            if (!result.success) {
                setError(result.error ?? 'Something went wrong. Please try again.')
                return
            }

            // Brief success flash before closing
            setSuccess(true)
            setTimeout(() => {
                setSuccess(false)
                onSuccess()
                onClose()
            }, 800)

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
        } finally {
            setSaving(false)
        }
    }, [fullName, bio, location, avatarFile, avatarPreview, userId, profile.avatarUrl, onSuccess, onClose])

    // ── Close handler — don't close while saving ─────────────────
    const handleClose = useCallback(() => {
        if (saving) return
        onClose()
    }, [saving, onClose])

    if (!isOpen) return null

    return (
        // Backdrop
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                bg-black/40 backdrop-blur-sm p-4
                animate-[fadeIn_.2s_ease_both]"
            onClick={e => e.target === e.currentTarget && handleClose()}
        >
            <div
                className="bg-white w-full max-w-[480px] rounded-2xl shadow-2xl overflow-hidden
                    animate-[slideUp_.25s_ease_both]"
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-900">Edit Profile</h2>
                    <button
                        onClick={handleClose}
                        disabled={saving}
                        className="w-8 h-8 flex items-center justify-center rounded-full
                            text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-6 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">

                        {/* ── AVATAR SECTION ── */}
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400
                                uppercase tracking-widest mb-3">
                                Profile Photo
                            </label>

                            <div className="flex items-center gap-5">
                                {/* Current avatar preview */}
                                <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0
                                    border-2 border-gray-100 shadow-sm">
                                    {avatarPreview ? (
                                        <Image
                                            src={avatarPreview}
                                            alt="Avatar preview"
                                            fill
                                            sizes="80px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className={`w-full h-full bg-gradient-to-br ${gradient}
                                            flex items-center justify-center`}>
                                            <span className="text-white font-black text-2xl select-none">
                                                {initials}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    {/* Upload button */}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100
                                            text-teal-800 text-sm font-semibold px-4 py-2 rounded-xl
                                            border border-teal-200 transition-colors"
                                    >
                                        <CameraIcon className="w-4 h-4" />
                                        {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                                    </button>

                                    {/* Remove button — only when avatar exists */}
                                    {avatarPreview && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveAvatar}
                                            className="text-xs text-gray-400 hover:text-red-500
                                                transition-colors font-medium"
                                        >
                                            Remove photo
                                        </button>
                                    )}

                                    <p className="text-[11px] text-gray-400">
                                        JPG, PNG or WebP · Max 2 MB
                                    </p>
                                </div>
                            </div>

                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>

                        {/* ── DISPLAY NAME ── */}
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400
                                uppercase tracking-widest mb-1.5">
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                placeholder="Your full name"
                                maxLength={50}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5
                                    text-sm text-gray-800 outline-none
                                    focus:border-teal-500 focus:ring-2 focus:ring-teal-100
                                    transition placeholder:text-gray-400"
                            />
                            <p className="text-[11px] text-gray-400 mt-1">
                                Shown on your listings. Defaults to @{profile.username}.
                            </p>
                        </div>

                        {/* ── BIO ── */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-[11px] font-bold text-gray-400
                                    uppercase tracking-widest">
                                    Bio
                                </label>
                                <span className={`text-[11px] font-medium ${
                                    bioRemaining < 20 ? 'text-amber-500' : 'text-gray-400'
                                }`}>
                                    {bioRemaining} left
                                </span>
                            </div>
                            <textarea
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                placeholder="Tell buyers a bit about yourself — devices you specialize in, how you care for your tech, etc."
                                maxLength={300}
                                rows={3}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5
                                    text-sm text-gray-800 outline-none resize-none
                                    focus:border-teal-500 focus:ring-2 focus:ring-teal-100
                                    transition placeholder:text-gray-400"
                            />
                        </div>

                        {/* ── LOCATION ── */}
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400
                                uppercase tracking-widest mb-1.5">
                                Location
                            </label>
                            <input
                                type="text"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                placeholder="e.g. Ho Chi Minh City, Vietnam"
                                maxLength={60}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5
                                    text-sm text-gray-800 outline-none
                                    focus:border-teal-500 focus:ring-2 focus:ring-teal-100
                                    transition placeholder:text-gray-400"
                            />
                        </div>

                        {/* ── Error banner ── */}
                        {error && (
                            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200
                                rounded-xl px-4 py-3">
                                <ExclamationCircleIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}
                    </div>

                    {/* ── Footer buttons ── */}
                    <div className="flex items-center gap-3 px-6 pb-6">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={saving}
                            className="flex-1 h-11 border-2 border-gray-200 text-gray-500
                                font-semibold rounded-xl text-sm hover:border-gray-300
                                transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || success}
                            className="flex-1 h-11 bg-teal-800 hover:bg-teal-700 text-white
                                font-bold rounded-xl text-sm flex items-center justify-center gap-2
                                transition-all hover:-translate-y-0.5 hover:shadow-md
                                disabled:opacity-60 disabled:cursor-wait disabled:translate-y-0"
                        >
                            {success ? (
                                <>
                                    <CheckSolid className="w-4 h-4 text-emerald-300" />
                                    Saved!
                                </>
                            ) : saving ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor"
                                            strokeWidth="3" strokeOpacity=".3" />
                                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor"
                                            strokeWidth="3" strokeLinecap="round" />
                                    </svg>
                                    Saving…
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}