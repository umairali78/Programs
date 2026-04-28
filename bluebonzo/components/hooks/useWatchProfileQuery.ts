'use client'

import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_WATCH_PROFILE, type WatchProfile } from '@/lib/settings/watch-profile'

const STORAGE_KEY = 'bluebonzo-watch-profile'

export function useWatchProfileQuery() {
  const [profile, setProfile] = useState<WatchProfile>(DEFAULT_WATCH_PROFILE)

  useEffect(() => {
    setProfile(readProfile())
  }, [])

  return useMemo(() => {
    const params = new URLSearchParams()
    params.set('commodities', profile.commodities.join(','))
    params.set('regions', profile.regions.join(','))
    params.set('jurisdictions', profile.jurisdictions.join(','))
    const query = params.toString()
    return query ? `?${query}` : ''
  }, [profile])
}

function readProfile(): WatchProfile {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_WATCH_PROFILE
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed.commodities) || !Array.isArray(parsed.regions) || !Array.isArray(parsed.jurisdictions)) {
      return DEFAULT_WATCH_PROFILE
    }
    return parsed
  } catch {
    return DEFAULT_WATCH_PROFILE
  }
}
