'use client'

import { Check } from 'lucide-react'

type StepStatus = 'upcoming' | 'current' | 'complete'

interface Step {
  id: string
  label: string
  status: StepStatus
}

interface StepsProps {
  steps: Step[]
  activeStep: string
  onStepClick: (stepId: string) => void
}

export const Steps = ({ steps, activeStep, onStepClick }: StepsProps) => {
  return (
    <div className="w-full mb-8">
      {/* Desktop steps */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Progress bar */}
          <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${(steps.findIndex((s) => s.id === activeStep) / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                <button
                  onClick={() => {
                    if (step.status !== 'upcoming') {
                      onStepClick(step.id)
                    }
                  }}
                  disabled={step.status === 'upcoming'}
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full z-10
                    ${step.status === 'complete' ? 'bg-primary text-white' : ''}
                    ${step.status === 'current' ? 'border-2 border-primary text-primary bg-white' : ''}
                    ${step.status === 'upcoming' ? 'bg-gray-100 text-gray-400' : ''}
                    ${step.status !== 'upcoming' ? 'cursor-pointer' : 'cursor-not-allowed'}
                  `}
                  aria-current={step.id === activeStep ? 'step' : undefined}
                >
                  {step.status === 'complete' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
                <span
                  className={`
                    mt-2 text-xs font-medium text-center max-w-[100px]
                    ${step.id === activeStep ? 'text-primary' : 'text-gray-500'}
                  `}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile steps */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center">
              <button
                onClick={() => {
                  if (step.status !== 'upcoming') {
                    onStepClick(step.id)
                  }
                }}
                disabled={step.status === 'upcoming'}
                className={`
                  flex items-center justify-center w-7 h-7 rounded-full
                  ${step.status === 'complete' ? 'bg-primary text-white' : ''}
                  ${step.status === 'current' ? 'border-2 border-primary text-primary bg-white' : ''}
                  ${step.status === 'upcoming' ? 'bg-gray-100 text-gray-400' : ''}
                  ${step.status !== 'upcoming' ? 'cursor-pointer' : 'cursor-not-allowed'}
                `}
                aria-current={step.id === activeStep ? 'step' : undefined}
              >
                {step.status === 'complete' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full bg-gray-200 mb-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${(steps.findIndex((s) => s.id === activeStep) / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        <p className="text-sm font-medium text-primary text-center">
          {steps.find((s) => s.id === activeStep)?.label}
        </p>
      </div>
    </div>
  )
}
