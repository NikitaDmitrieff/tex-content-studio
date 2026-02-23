'use client'

import { Check } from 'lucide-react'

type Step = {
  number: number
  label: string
}

export function StepIndicator({
  steps,
  currentStep,
}: {
  steps: Step[]
  currentStep: number
}) {
  return (
    <div className="glass-card p-4 px-6">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isActive = step.number === currentStep
          const isCompleted = step.number < currentStep

          return (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              {/* Step circle and label */}
              <div className="flex items-center gap-3">
                <div
                  className={`step-dot ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.number}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block ${
                    isActive
                      ? 'text-white'
                      : isCompleted
                        ? 'text-emerald-400'
                        : 'text-zinc-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div className={`step-line mx-4 ${isCompleted ? 'completed' : ''}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
