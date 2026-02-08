/**
 * Test data for Pearly Nails booking system
 * Based on the actual Square calendar schedule
 *
 * Days off pattern (grey columns in calendar):
 * - 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 */

// Technician schedules based on the Square calendar screenshot
// daysOff: array of day numbers (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
const technicianSchedules = {
  // Based on visual inspection of the calendar screenshot
  // Grey columns indicate days off
  'Chung': { daysOff: [0, 3] },        // Off Sunday, Wednesday
  'Hieu': { daysOff: [0, 4] },         // Off Sunday, Thursday
  'Miri': { daysOff: [0, 1] },         // Off Sunday, Monday
  'Nancy': { daysOff: [0, 2] },        // Off Sunday, Tuesday
  'Tiffany': { daysOff: [0, 5] },      // Off Sunday, Friday
  'Traci': { daysOff: [0, 6] },        // Off Sunday, Saturday
  'Vinh': { daysOff: [0, 1, 4] },      // Off Sunday, Monday, Thursday
};

// Services available for booking (subset for faster tests)
const testServices = [
  { id: 'bare-manicure', name: 'Bare Manicure', price: 20, duration: 30 },
  { id: 'spa-manicure', name: 'Spa Manicure (regular polish)', price: 30, duration: 45 },
  { id: 'gel-spa-manicure', name: 'Gel Spa Manicure', price: 38, duration: 60 },
  { id: 'quick-pedicure', name: 'Quick Pedicure', price: 38, duration: 45 },
  { id: 'spa-pedicure', name: 'Spa Pedicure', price: 45, duration: 60 },
  { id: 'gel-spa-pedicure', name: 'Gel Spa Pedicure', price: 55, duration: 75 },
  { id: 'eyebrow', name: 'Eyebrow', price: 10, duration: 15 },
  { id: 'take-off', name: 'Take Off', price: 10, duration: 15 },
];

// All available services (full list)
const allServices = [
  // Nail Services
  { id: 'take-off', name: 'Take Off', category: 'Nail Services', price: 10, duration: 15 },
  { id: 'fix', name: 'Fix', category: 'Nail Services', price: 15, duration: 30 },
  { id: 'add-gel-polish', name: 'Add Gel Polish', category: 'Nail Services', price: 8, duration: 15 },
  { id: 'polish-change', name: 'Polish Change', category: 'Nail Services', price: 10, duration: 20 },
  { id: 'paraffin-wax', name: 'Paraffin Wax', category: 'Nail Services', price: 10, duration: 15 },
  // Manicures
  { id: 'bare-manicure', name: 'Bare Manicure', category: 'Manicures', price: 20, duration: 30 },
  { id: 'spa-manicure', name: 'Spa Manicure (regular polish)', category: 'Manicures', price: 30, duration: 45 },
  { id: 'gel-spa-manicure', name: 'Gel Spa Manicure', category: 'Manicures', price: 38, duration: 60 },
  { id: 'french-gel-manicure', name: 'French Gel Manicure', category: 'Manicures', price: 40, duration: 60 },
  // Pedicures
  { id: 'quick-pedicure', name: 'Quick Pedicure', category: 'Pedicures', price: 38, duration: 45 },
  { id: 'spa-pedicure', name: 'Spa Pedicure', category: 'Pedicures', price: 45, duration: 60 },
  { id: 'sport-pedicure', name: 'Sport Pedicure *no polish*', category: 'Pedicures', price: 55, duration: 60 },
  { id: 'gel-spa-pedicure', name: 'Gel Spa Pedicure', category: 'Pedicures', price: 55, duration: 75 },
  { id: 'deluxe-pedicure', name: 'Deluxe Pedicure no polish', category: 'Pedicures', price: 65, duration: 75 },
  { id: 'deluxe-gel-polish', name: 'Deluxe Gel Polish', category: 'Pedicures', price: 75, duration: 90 },
  // Kids Services
  { id: 'kids-combo', name: '*Kids Combo 5yr & up*', category: 'Kids Services', price: 7, duration: 30 },
  { id: 'kids-manicure', name: '*Kids Manicure', category: 'Kids Services', price: 10, duration: 30 },
  { id: 'kids-pedicure', name: '*Kids Pedicure', category: 'Kids Services', price: 10, duration: 30 },
  // Waxing
  { id: 'upper-lip', name: 'Upper Lip', category: 'Waxing', price: 5, duration: 10 },
  { id: 'chin', name: 'Chin', category: 'Waxing', price: 6, duration: 10 },
  { id: 'eyebrow', name: 'Eyebrow', category: 'Waxing', price: 10, duration: 15 },
  { id: 'sideburn', name: 'sideburn', category: 'Waxing', price: 10, duration: 15 },
  { id: 'half-face', name: 'Half Face', category: 'Waxing', price: 12, duration: 20 },
  { id: 'brow-tinting', name: 'Brow Tinting', category: 'Waxing', price: 15, duration: 20 },
  { id: 'under-arm', name: 'Under Arm', category: 'Waxing', price: 15, duration: 20 },
  { id: 'full-face', name: 'Full Face', category: 'Waxing', price: 7, duration: 30 },
];

// Business hours
const businessHours = {
  SUN: { open: '10:00', close: '16:00', lastBooking: '15:00' },
  MON: { open: '09:00', close: '18:00', lastBooking: '17:00' },
  TUE: { open: '09:00', close: '18:00', lastBooking: '17:00' },
  WED: { open: '09:00', close: '18:00', lastBooking: '17:00' },
  THU: { open: '09:00', close: '18:00', lastBooking: '17:00' },
  FRI: { open: '09:00', close: '18:00', lastBooking: '17:00' },
  SAT: { open: '09:00', close: '18:00', lastBooking: '17:00' },
};

// Time slots (30-minute intervals)
const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'
];

// Random guest names for testing
const testGuestNames = [
  'Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Henry',
  'Ivy', 'Jack', 'Kate', 'Leo', 'Mia', 'Noah', 'Olivia', 'Peter',
  'Quinn', 'Rose', 'Sam', 'Tina', 'Uma', 'Victor', 'Wendy', 'Xander'
];

// Test contact info
const testContactInfo = {
  name: 'Test User',
  phone: '250-555-0123',
  email: 'test@example.com',
  specialRequests: 'This is an automated test booking - please ignore'
};

module.exports = {
  technicianSchedules,
  testServices,
  allServices,
  businessHours,
  timeSlots,
  testGuestNames,
  testContactInfo,
};
