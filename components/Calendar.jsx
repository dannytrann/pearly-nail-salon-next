'use client'

import { useState, useMemo } from 'react'

export default function Calendar({
  selectedDate,
  onDateSelect,
  availableDates = [], // Array of date strings that have availability
  minDate = new Date()
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) {
      return new Date(selectedDate + 'T00:00:00')
    }
    return new Date()
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Abbreviated month names to match Square design
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startingDayOfWeek = firstDay.getDay()
    const totalDays = lastDay.getDate()

    const days = []

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: null, date: null })
    }

    // Add days of the month
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day)
      const dateString = date.toISOString().split('T')[0]
      days.push({
        day,
        date: dateString,
        isToday: date.getTime() === today.getTime(),
        isPast: date < today,
        isSelected: dateString === selectedDate,
        hasAvailability: availableDates.length === 0 || availableDates.includes(dateString)
      })
    }

    return days
  }, [currentMonth, selectedDate, availableDates, today])

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const handleDateClick = (dateString, isPast) => {
    if (isPast) return
    onDateSelect(dateString)
  }

  // Format selected date for display (e.g., "Saturday, Jan 17, 2026")
  const formatSelectedDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const day = date.getDate()
    const year = date.getFullYear()
    return `${dayName}, ${month} ${day}, ${year}`
  }

  // Check if we can go to previous month (not before current month)
  const canGoPrevious = currentMonth.getFullYear() > today.getFullYear() ||
    (currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() > today.getMonth())

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-6 py-5">
        <button
          onClick={goToPreviousMonth}
          disabled={!canGoPrevious}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            canGoPrevious
              ? 'hover:bg-gray-100 text-gray-600'
              : 'text-gray-300 cursor-not-allowed'
          }`}
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h3 className="text-xl font-semibold text-neutral-850">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>

        <button
          onClick={goToNextMonth}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-600 transition-colors"
          aria-label="Next month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 px-4">
        {dayNames.map(day => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 px-4 pb-4">
        {calendarDays.map((dayInfo, index) => (
          <div
            key={index}
            className="aspect-square flex items-center justify-center py-1"
          >
            {dayInfo.day && (
              <button
                onClick={() => handleDateClick(dayInfo.date, dayInfo.isPast)}
                disabled={dayInfo.isPast}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                  dayInfo.isSelected
                    ? 'bg-neutral-850 text-white'
                    : dayInfo.isToday
                    ? 'border-2 border-gray-300 text-gray-600'
                    : dayInfo.isPast
                    ? 'text-gray-300 cursor-not-allowed'
                    : dayInfo.hasAvailability
                    ? 'text-primary hover:border-2 hover:border-primary cursor-pointer'
                    : 'text-gray-300'
                }`}
              >
                {dayInfo.day}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Collapse button */}
      <div className="flex justify-center pb-2">
        <button className="p-1 text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      {/* Timezone Note */}
      <div className="px-4 py-3 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          Times are shown in PST.
        </p>
      </div>

      {/* Selected Date Display */}
      {selectedDate && (
        <div className="px-6 py-4 border-t border-gray-200">
          <p className="font-semibold text-neutral-850">
            {formatSelectedDate(selectedDate)}
          </p>
        </div>
      )}
    </div>
  )
}
