import { Shoe, Trail, Event } from './types';

export const INVENTORY: Shoe[] = [
  {
    id: 'saucony-peregrine-15',
    name: 'Peregrine 15',
    brand: 'Saucony',
    price: 140,
    category: 'Trail',
    support: 'Neutral',
    cushion: 'Balanced',
    drop: 4,
    weight: 9.2,
    image: 'https://picsum.photos/400/400?random=1',
    isStaffPick: true,
    description: 'The ultimate trail bird. Grippy, fast, and ready for mud.',
    staffComparison: 'More aggressive lugs than the Speedgoat, but less cushion.'
  },
  {
    id: 'brooks-ghost-16',
    name: 'Ghost 16',
    brand: 'Brooks',
    price: 140,
    category: 'Road',
    support: 'Neutral',
    cushion: 'Balanced',
    drop: 12,
    weight: 9.8,
    image: 'https://picsum.photos/400/400?random=2',
    description: 'A smooth ride that disappears on your foot. The daily driver standard.',
    staffComparison: 'Softer heel strike compared to the Ghost 15.'
  },
  {
    id: 'hoka-speedgoat-6',
    name: 'Speedgoat 6',
    brand: 'Hoka',
    price: 155,
    category: 'Trail',
    support: 'Neutral',
    cushion: 'Plush',
    drop: 4,
    weight: 10.1,
    image: 'https://picsum.photos/400/400?random=3',
    isStaffPick: true,
    description: 'Max cushion meets max grip. Conquer any terrain in comfort.',
    staffComparison: 'Wider platform than the Peregrine, ideal for ultra distances.'
  },
  {
    id: 'nb-1080-v13',
    name: 'Fresh Foam X 1080v13',
    brand: 'New Balance',
    price: 165,
    category: 'Road',
    support: 'Neutral',
    cushion: 'Plush',
    drop: 6,
    weight: 9.2,
    image: 'https://picsum.photos/400/400?random=4',
    description: 'If you only make one running shoe, this is the one. Soft, breathable, reliable.',
    staffComparison: 'Significantly softer than the previous v12 model.'
  },
  {
    id: 'saucony-guide-17',
    name: 'Guide 17',
    brand: 'Saucony',
    price: 140,
    category: 'Road',
    support: 'Stability',
    cushion: 'Balanced',
    drop: 6,
    weight: 9.4,
    image: 'https://picsum.photos/400/400?random=5',
    description: 'CenterPath Technology provides stability without the stiffness.',
    staffComparison: 'Less obtrusive support than traditional post-based stability shoes.'
  },
  {
    id: 'altra-lone-peak-8',
    name: 'Lone Peak 8',
    brand: 'Altra',
    price: 140,
    category: 'Trail',
    support: 'Neutral',
    cushion: 'Balanced',
    drop: 0,
    weight: 10.7,
    image: 'https://picsum.photos/400/400?random=6',
    description: 'The legend of the trails. Zero drop, wide toe box, full control.',
    staffComparison: 'Widest toe box in our trail lineup. Requires transition if new to zero drop.'
  }
];

export const TRAILS: Trail[] = [
  { 
    id: 'austin-badger', 
    name: 'Austin Badger', 
    distance: '3.5 - 5.0 miles', 
    surface: 'Crushed Limestone / Singletrack', 
    description: 'Hilly and scenic, great for hill repeats.',
    status: 'Open',
    highlights: ['Scenic Overlooks', 'Technical Singletrack Sections', 'Bathroom Facilities'],
    parkingInfo: 'Large lot off River Styx Rd.'
  },
  { 
    id: 'chippewa', 
    name: 'Chippewa Rail Trail', 
    distance: '10+ miles', 
    surface: 'Paved', 
    description: 'Fast, flat out-and-back. Perfect for tempo runs.',
    status: 'Open',
    highlights: ['Mile Markers', 'Shaded Sections', 'Connects to Buckeye Woods'],
    parkingInfo: 'Parking at various trailheads.'
  },
  { 
    id: 'lake-medina', 
    name: 'Lake Medina', 
    distance: '1.8 miles loop', 
    surface: 'Mixed', 
    description: 'Scenic lake loop with steep elevation changes.',
    status: 'Muddy',
    highlights: ['Lake Views', 'Steep Grades', 'Observation Deck'],
    parkingInfo: 'Lot off Route 18.'
  }
];

export const EVENTS: Event[] = [
  { 
    id: 'sole-train', 
    name: 'Sole Train', 
    day: 'Tue / Thu / Sat', 
    time: '6:30 PM / 8:00 AM', 
    description: 'Community group run for all paces. Meet at the store.',
    paceGroups: ['Walk/Run', '10:00 - 11:00 min/mi', '9:00 - 9:45 min/mi', '8:00 - 8:45 min/mi', 'Sub 8:00']
  },
  { 
    id: 'trail-heads', 
    name: 'Trail Heads', 
    day: 'Monday', 
    time: '6:30 PM', 
    description: 'Weekly trail exploration. Headlamps required in winter.',
    paceGroups: ['No Drop', 'Adventure Pace']
  }
];