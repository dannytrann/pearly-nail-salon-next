/**
 * Random selection utilities for booking system tests
 */

const { technicianSchedules, testServices, allServices, testGuestNames } = require('./test-data');

/**
 * Get a random integer between min (inclusive) and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get a random element from an array
 */
function randomElement(array) {
  return array[randomInt(0, array.length - 1)];
}

/**
 * Get N random elements from an array (no duplicates)
 */
function randomElements(array, count) {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Get a random group size (1-6)
 */
function randomGroupSize(max = 6) {
  // Weighted towards smaller groups (more realistic)
  const weights = [40, 25, 15, 10, 7, 3]; // 1, 2, 3, 4, 5, 6 guests
  const total = weights.slice(0, max).reduce((a, b) => a + b, 0);
  let random = Math.random() * total;

  for (let i = 0; i < max; i++) {
    random -= weights[i];
    if (random <= 0) return i + 1;
  }
  return 1;
}

/**
 * Get random services (1-3 services per guest)
 */
function randomServices(count = null, useFullList = false) {
  const serviceCount = count || randomInt(1, 3);
  const serviceList = useFullList ? allServices : testServices;
  return randomElements(serviceList, serviceCount);
}

/**
 * Get available technicians for a given date
 */
function getAvailableTechnicians(date) {
  const dayOfWeek = new Date(date).getDay();
  const available = [];

  for (const [name, schedule] of Object.entries(technicianSchedules)) {
    if (!schedule.daysOff.includes(dayOfWeek)) {
      available.push(name);
    }
  }

  return available;
}

/**
 * Get a random technician (including 'Any Staff' option)
 */
function randomTechnician(includeAnyStaff = true) {
  const technicians = Object.keys(technicianSchedules);
  if (includeAnyStaff) {
    technicians.unshift('Any Staff');
  }
  return randomElement(technicians);
}

/**
 * Get a random available technician for a specific date
 */
function randomAvailableTechnician(date, includeAnyStaff = true) {
  const available = getAvailableTechnicians(date);
  if (available.length === 0) return 'Any Staff';

  if (includeAnyStaff) {
    available.unshift('Any Staff');
  }
  return randomElement(available);
}

/**
 * Get a random date in the next N days that has at least one technician available
 */
function randomValidDate(daysAhead = 30, excludeDates = []) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from tomorrow
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() + 1);

  const validDates = [];

  for (let i = 0; i < daysAhead; i++) {
    const checkDate = new Date(startDate);
    checkDate.setDate(checkDate.getDate() + i);

    const dateStr = checkDate.toISOString().split('T')[0];

    // Skip excluded dates
    if (excludeDates.includes(dateStr)) continue;

    // Check if at least one technician is available
    const available = getAvailableTechnicians(dateStr);
    if (available.length > 0) {
      validDates.push(dateStr);
    }
  }

  return randomElement(validDates);
}

/**
 * Get a random date where a specific technician is working
 */
function randomDateForTechnician(technicianName, daysAhead = 30) {
  const schedule = technicianSchedules[technicianName];
  if (!schedule) return randomValidDate(daysAhead);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() + 1);

  const validDates = [];

  for (let i = 0; i < daysAhead; i++) {
    const checkDate = new Date(startDate);
    checkDate.setDate(checkDate.getDate() + i);

    const dayOfWeek = checkDate.getDay();
    if (!schedule.daysOff.includes(dayOfWeek)) {
      validDates.push(checkDate.toISOString().split('T')[0]);
    }
  }

  return randomElement(validDates);
}

/**
 * Get a random guest name
 */
function randomGuestName(usedNames = []) {
  const available = testGuestNames.filter(n => !usedNames.includes(n));
  if (available.length === 0) {
    return `Guest_${randomInt(1000, 9999)}`;
  }
  return randomElement(available);
}

/**
 * Generate random booking data for a group
 */
function generateRandomBooking(options = {}) {
  const {
    groupSize = randomGroupSize(),
    preferredDate = null,
    useFullServiceList = false,
  } = options;

  const guests = [];
  const usedNames = [];
  const usedTechnicians = [];

  for (let i = 0; i < groupSize; i++) {
    const guestName = randomGuestName(usedNames);
    usedNames.push(guestName);

    const services = randomServices(null, useFullServiceList);

    // For technician selection, try to pick someone not already selected
    let technician;
    const allTechs = ['Any Staff', ...Object.keys(technicianSchedules)];
    const availableTechs = allTechs.filter(t =>
      t === 'Any Staff' || !usedTechnicians.includes(t)
    );

    if (availableTechs.length > 0) {
      technician = randomElement(availableTechs);
      if (technician !== 'Any Staff') {
        usedTechnicians.push(technician);
      }
    } else {
      technician = 'Any Staff';
    }

    guests.push({
      guestNumber: i + 1,
      guestName,
      services,
      technician,
      totalPrice: services.reduce((sum, s) => sum + s.price, 0),
      totalDuration: services.reduce((sum, s) => sum + s.duration, 0),
    });
  }

  // Find a date that works for all selected technicians
  let date = preferredDate;
  if (!date) {
    const specificTechs = guests
      .map(g => g.technician)
      .filter(t => t !== 'Any Staff');

    if (specificTechs.length > 0) {
      // Find a date where all specific technicians are available
      const validDates = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 1; i <= 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() + i);
        const dateStr = checkDate.toISOString().split('T')[0];

        const allAvailable = specificTechs.every(tech => {
          const schedule = technicianSchedules[tech];
          return schedule && !schedule.daysOff.includes(checkDate.getDay());
        });

        if (allAvailable) {
          validDates.push(dateStr);
        }
      }

      date = validDates.length > 0 ? randomElement(validDates) : randomValidDate();
    } else {
      date = randomValidDate();
    }
  }

  return {
    groupSize,
    guests,
    date,
    time: null, // Will be selected from available slots during test
  };
}

/**
 * Format a date for display
 */
function formatDateForDisplay(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Check if a technician is working on a given date
 */
function isTechnicianWorking(technicianName, dateStr) {
  const schedule = technicianSchedules[technicianName];
  if (!schedule) return true; // Unknown technician, assume working

  const date = new Date(dateStr + 'T00:00:00');
  return !schedule.daysOff.includes(date.getDay());
}

module.exports = {
  randomInt,
  randomElement,
  randomElements,
  randomGroupSize,
  randomServices,
  getAvailableTechnicians,
  randomTechnician,
  randomAvailableTechnician,
  randomValidDate,
  randomDateForTechnician,
  randomGuestName,
  generateRandomBooking,
  formatDateForDisplay,
  isTechnicianWorking,
};
