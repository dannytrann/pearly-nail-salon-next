import { create } from 'zustand'

export const useBookingStore = create((set, get) => ({
  // Group and guest info
  groupSize: 1,
  currentGuestIndex: 0,
  guests: [],

  // Pre-selected service (from main page "Book now" click)
  preSelectedService: null,

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

  // Assigned technicians (after booking, for "Any Staff" selections)
  assignedTechnicians: [],

  // Actions
  setPreSelectedService: (service) => set({ preSelectedService: service }),

  setGroupSize: (size) => set((state) => {
    const preSelectedService = state.preSelectedService

    // Create guests array, with first guest having pre-selected service if any
    const guests = Array.from({ length: size }, (_, i) => {
      if (i === 0 && preSelectedService) {
        // First guest gets the pre-selected service
        return {
          guestNumber: 1,
          guestName: '',
          services: [preSelectedService],
          technician: null,
          totalPrice: preSelectedService.price || 0,
          totalDuration: preSelectedService.duration || 0
        }
      }
      return {
        guestNumber: i + 1,
        guestName: '',
        services: [],
        technician: null,
        totalPrice: 0,
        totalDuration: 0
      }
    })

    return {
      groupSize: size,
      currentGuestIndex: 0,
      guests
    }
  }),

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

  updateGuestName: (guestIndex, name) => set((state) => {
    const newGuests = [...state.guests]
    newGuests[guestIndex] = { ...newGuests[guestIndex], guestName: name }
    return { guests: newGuests }
  }),

  setDateTime: (date, time) => set({ selectedDate: date, selectedTime: time }),

  setContactInfo: (info) => set({ contactInfo: info }),

  setAssignedTechnicians: (technicians) => set({ assignedTechnicians: technicians }),

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
    },
    assignedTechnicians: []
  }),

  // Helper getters
  getCurrentGuest: (state) => state.guests[state.currentGuestIndex],
  getTotalPrice: (state) => state.guests.reduce((sum, guest) => sum + guest.totalPrice, 0),
  getTotalDuration: (state) => Math.max(...state.guests.map(guest => guest.totalDuration)),
}))
