'use client'
// src/hooks/useSellForm.ts
// ─────────────────────────────────────────────────────────────────
// Centralises all sell-form state so each step component only
// receives the slices it needs.  Keeps the step components thin.
// ─────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react'
import type { CategoryOption, BrandOption, ModelOption } from '@/services/modelSpecService'

export type SellStep = 1 | 2 | 3 | 4

// ── The complete form data shape ───────────────────────────────────
export interface SellFormData {
    // Step 1 — Category
    category: CategoryOption | null
    brand: BrandOption | null

    // Step 2 — Device Details
    model: ModelOption | null
    customTitle: string          // editable title built from brand+model
    color: string
    storage: string
    specs: Record<string, string> // auto-filled then editable

    // Step 3 — Condition & Photos
    condition: 'like_new' | 'excellent' | 'good' | 'fair' | ''
    batteryHealth: number        // 0–100
    imeiStatus: 'clean' | 'flagged' | ''
    icloudStatus: 'unlocked' | 'locked' | ''
    carrierStatus: 'unlocked' | 'locked' | ''
    description: string
    // Uploaded photos — stored as { file, previewUrl }
    photos: { file: File; previewUrl: string }[]

    // Step 4 — Pricing
    price: number | ''
    originalPrice: number | ''
}

const INITIAL: SellFormData = {
    category: null,
    brand: null,
    model: null,
    customTitle: '',
    color: '',
    storage: '',
    specs: {},
    condition: '',
    batteryHealth: 85,
    imeiStatus: '',
    icloudStatus: 'unlocked',
    carrierStatus: 'unlocked',
    description: '',
    photos: [],
    price: '',
    originalPrice: '',
}

export function useSellForm() {
    const [step,    setStep]    = useState<SellStep>(1)
    const [data,    setData]    = useState<SellFormData>(INITIAL)
    const [errors,  setErrors]  = useState<Partial<Record<string, string>>>({})

    // ── Patch a subset of form fields ─────────────────────────────
    const patch = useCallback((updates: Partial<SellFormData>) => {
        setData(prev => ({ ...prev, ...updates }))
        // Clear errors for changed fields
        const cleared = Object.fromEntries(
            Object.keys(updates).map(k => [k, ''])
        )
        setErrors(prev => ({ ...prev, ...cleared }))
    }, [])

    // ── Per-step validation ────────────────────────────────────────
    function validate(targetStep: SellStep): boolean {
        const errs: Partial<Record<string, string>> = {}

        if (targetStep >= 1) {
            if (!data.category) errs.category = 'Please select a category'
            if (!data.brand)    errs.brand    = 'Please select a brand'
        }
        if (targetStep >= 2) {
            if (!data.model && !data.customTitle.trim())
                errs.model = 'Select a model or enter a device name'
            if (!data.storage.trim()) errs.storage = 'Storage is required'
            if (!data.color.trim())   errs.color   = 'Color is required'
        }
        if (targetStep >= 3) {
            if (!data.condition)  errs.condition = 'Please grade the condition'
            if (data.photos.length < 5) errs.photos = 'Upload at least 5 photos'
            if (!data.imeiStatus) errs.imeiStatus = 'Run the IMEI / Serial check'
        }
        if (targetStep >= 4) {
            if (!data.price || Number(data.price) <= 0)
                errs.price = 'Set a selling price'
        }

        setErrors(errs)
        return Object.values(errs).every(v => !v)
    }

    function goNext() {
        if (validate(step)) {
            setStep(s => Math.min(4, s + 1) as SellStep)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    function goBack() {
        setStep(s => Math.max(1, s - 1) as SellStep)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // ── Photo helpers ──────────────────────────────────────────────
    const addPhotos = useCallback((files: File[]) => {
        setData(prev => {
            // Prevent adding more than 10 photos total
            const remaining = 10 - prev.photos.length
            const toAdd = files.slice(0, remaining).map(file => ({
                file,
                previewUrl: URL.createObjectURL(file),
            }))
            return { ...prev, photos: [...prev.photos, ...toAdd] }
        })
        setErrors(prev => ({ ...prev, photos: '' }))
    }, [])

    const removePhoto = useCallback((index: number) => {
        setData(prev => {
            // Revoke the object URL to free memory
            URL.revokeObjectURL(prev.photos[index].previewUrl)
            const next = [...prev.photos]
            next.splice(index, 1)
            return { ...prev, photos: next }
        })
    }, [])

    const reorderPhotos = useCallback((from: number, to: number) => {
        setData(prev => {
            const next = [...prev.photos]
            const [moved] = next.splice(from, 1)
            next.splice(to, 0, moved)
            return { ...prev, photos: next }
        })
    }, [])

    return {
        step, data, errors, patch,
        goNext, goBack,
        addPhotos, removePhoto, reorderPhotos,
        validate,
    }
}