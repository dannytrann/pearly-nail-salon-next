import { create } from 'zustand'

export const useBookingStore = create((set) => ({
  // Group and guest info
  groupSize: 1,
  currentGuestIndex: 0,
  guests: [],

  // Date and time
  selectedDate: null,
  selectedTime: null,

  // Contact info
  contactInfo: {
    name: '',
    phone: '',
    email: '',
    specialRequests: ''
  },

  // Actions
  setGroupSize: (size) => set((state) => ({
    groupSize: size,
    currentGuestIndex: 0,
    guests: Array.from({ length: size }, (_, i) => ({
      guestNumber: i + 1,
      services: [],
      technician: null,
      totalPrice: 0,
      totalDuration: 0
    }))
  })),

  setCurrentGuestIndex: (index) => set({ currentGuestIndex: index }),

  updateGuestServices: (guestIndex, services) => set((state) => {
    const newGuests = [...state.guests]
    const totalPrice = services.reduce((sum, service) => sum + service.price, 0)
    const totalDuration = services.reduce((sum, service) => sum + service.duration, 0)

    newGuests[guestIndex] = {
      ...newGuests[guestIndex],
      services,
      totalPrice,
      totalDuration
    }

    return { guests: newGuests }
  }),

  updateGuestTechnician: (guestIndex, technician) => set((state) => {
    const newGuests = [...state.guests]
    newGuests[guestIndex] = {
      ...newGuests[guestIndex],
      technician
    }
    return { guests: newGuests }
  }),

  setDateTime: (date, time) => set({ selectedDate: date, selectedTime: time }),

  setContactInfo: (info) => set({ contactInfo: info }),

  // Reset store
  reset: () => set({
    groupSize: 1,
    currentGuestIndex: 0,
    guests: [],
    selectedDate: null,
    selectedTime: null,
    contactInfo: {
      name: '',
      phone: '',
      email: '',
      specialRequests: ''
    }
  }),

  // Helper getters
  getCurrentGuest: (state) => state.guests[state.currentGuestIndex],
  getTotalPrice: (state) => state.guests.reduce((sum, guest) => sum + guest.totalPrice, 0),
  getTotalDuration: (state) => Math.max(...state.guests.map(guest => guest.totalDuration)),
}))
