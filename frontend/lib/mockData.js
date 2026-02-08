export const services = [
  // Nail Services - Basic
  {
    id: 'take-off',
    name: 'Take Off',
    category: 'Nail Services',
    price: 10,
    duration: 15,
    description: 'Gel or acrylic removal'
  },
  {
    id: 'fix',
    name: 'Fix',
    category: 'Nail Services',
    price: 15,
    duration: 30,
    description: 'Nail repair service'
  },
  {
    id: 'add-gel-polish',
    name: 'Add Gel Polish',
    category: 'Nail Services',
    price: 8,
    duration: 15,
    description: 'Add gel polish to any service'
  },
  {
    id: 'polish-change',
    name: 'Polish Change',
    category: 'Nail Services',
    price: 10,
    duration: 20,
    description: 'Simple polish change'
  },
  {
    id: 'paraffin-wax',
    name: 'Paraffin Wax',
    category: 'Nail Services',
    price: 10,
    duration: 15,
    description: 'Moisturizing paraffin wax treatment'
  },

  // Manicures
  {
    id: 'bare-manicure',
    name: 'Bare Manicure',
    category: 'Manicures',
    price: 20,
    duration: 30,
    description: 'Basic nail care and shaping'
  },
  {
    id: 'spa-manicure',
    name: 'Spa Manicure (regular polish)',
    category: 'Manicures',
    price: 30,
    duration: 45,
    description: 'Spa treatment with regular polish'
  },
  {
    id: 'gel-spa-manicure',
    name: 'Gel Spa Manicure',
    category: 'Manicures',
    price: 38,
    duration: 60,
    description: 'Spa manicure with gel polish'
  },
  {
    id: 'french-gel-manicure',
    name: 'French Gel Manicure',
    category: 'Manicures',
    price: 40,
    duration: 60,
    description: 'Classic French style with gel'
  },

  // Pedicures
  {
    id: 'quick-pedicure',
    name: 'Quick Pedicure',
    category: 'Pedicures',
    price: 38,
    duration: 45,
    description: 'Express pedicure service'
  },
  {
    id: 'spa-pedicure',
    name: 'Spa Pedicure',
    category: 'Pedicures',
    price: 45,
    duration: 60,
    description: 'Full spa pedicure with foot soak and massage'
  },
  {
    id: 'sport-pedicure',
    name: 'Sport Pedicure *no polish*',
    category: 'Pedicures',
    price: 55,
    duration: 60,
    description: 'Athletic foot care without polish'
  },
  {
    id: 'gel-spa-pedicure',
    name: 'Gel Spa Pedicure',
    category: 'Pedicures',
    price: 55,
    duration: 75,
    description: 'Spa pedicure with gel polish'
  },
  {
    id: 'deluxe-pedicure',
    name: 'Deluxe Pedicure no polish',
    category: 'Pedicures',
    price: 65,
    duration: 75,
    description: 'Premium pedicure treatment'
  },
  {
    id: 'deluxe-gel-polish',
    name: 'Deluxe Gel Polish',
    category: 'Pedicures',
    price: 75,
    duration: 90,
    description: 'Deluxe treatment with gel polish'
  },

  // Kids Services
  {
    id: 'kids-combo',
    name: '*Kids Combo 5yr & up*',
    category: 'Kids Services',
    price: 7,
    duration: 30,
    description: 'Special combo for kids 5 years and up'
  },
  {
    id: 'kids-manicure',
    name: '*Kids Manicure',
    category: 'Kids Services',
    price: 10,
    duration: 30,
    description: 'Gentle manicure for children'
  },
  {
    id: 'kids-pedicure',
    name: '*Kids Pedicure',
    category: 'Kids Services',
    price: 10,
    duration: 30,
    description: 'Gentle pedicure for children'
  },

  // Waxing Services
  {
    id: 'upper-lip',
    name: 'Upper Lip',
    category: 'Waxing',
    price: 5,
    duration: 10,
    description: 'Upper lip waxing'
  },
  {
    id: 'chin',
    name: 'Chin',
    category: 'Waxing',
    price: 6,
    duration: 10,
    description: 'Chin waxing'
  },
  {
    id: 'eyebrow',
    name: 'Eyebrow',
    category: 'Waxing',
    price: 10,
    duration: 15,
    description: 'Eyebrow shaping and waxing'
  },
  {
    id: 'sideburn',
    name: 'sideburn',
    category: 'Waxing',
    price: 10,
    duration: 15,
    description: 'Sideburn waxing'
  },
  {
    id: 'half-face',
    name: 'Half Face',
    category: 'Waxing',
    price: 12,
    duration: 20,
    description: 'Half face waxing'
  },
  {
    id: 'brow-tinting',
    name: 'Brow Tinting',
    category: 'Waxing',
    price: 15,
    duration: 20,
    description: 'Professional eyebrow tinting'
  },
  {
    id: 'under-arm',
    name: 'Under Arm',
    category: 'Waxing',
    price: 15,
    duration: 20,
    description: 'Underarm waxing'
  },
  {
    id: 'full-face',
    name: 'Full Face',
    category: 'Waxing',
    price: 7,
    duration: 30,
    description: 'Complete facial waxing'
  }
]

export const technicians = [
  { id: 'kim', name: 'Kim' },
  { id: 'tan', name: 'Tan' },
  { id: 'mia', name: 'Mia' }
]

export const categories = {
  'Nail Services': services.filter(s => s.category === 'Nail Services'),
  'Manicures': services.filter(s => s.category === 'Manicures'),
  'Pedicures': services.filter(s => s.category === 'Pedicures'),
  'Kids Services': services.filter(s => s.category === 'Kids Services'),
  'Waxing': services.filter(s => s.category === 'Waxing')
}

export const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
]
