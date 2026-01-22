"use client"

import React, { createContext, useContext, useState } from "react"

type SettingsContextType = {
  threshold: number
  setThreshold: (n: number) => void
  showValues: boolean
  setShowValues: (v: boolean) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [threshold, setThreshold] = useState<number>(40)
  const [showValues, setShowValues] = useState<boolean>(true)

  return (
    <SettingsContext.Provider value={{ threshold, setThreshold, showValues, setShowValues }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider")
  return ctx
}
