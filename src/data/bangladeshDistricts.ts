export interface DistrictInfo {
  name: string;
  division: string;
  defaultZone: 'Inside Dhaka City' | 'Outside Dhaka City';
}

export const BANGLADESH_DISTRICTS: DistrictInfo[] = [
  // Dhaka Division
  { name: 'Dhaka', division: 'Dhaka', defaultZone: 'Inside Dhaka City' },
  { name: 'Gazipur', division: 'Dhaka', defaultZone: 'Outside Dhaka City' },
  { name: 'Narayanganj', division: 'Dhaka', defaultZone: 'Outside Dhaka City' },
  { name: 'Tangail', division: 'Dhaka', defaultZone: 'Outside Dhaka City' },
  { name: 'Kishoreganj', division: 'Dhaka', defaultZone: 'Outside Dhaka City' },
  { name: 'Manikganj', division: 'Dhaka', defaultZone: 'Outside Dhaka City' },
  { name: 'Munshiganj', division: 'Dhaka', defaultZone: 'Outside Dhaka City' },
  { name: 'Narsingdi', division: 'Dhaka', defaultZone: 'Outside Dhaka City' },
  { name: 'Faridpur', division: 'Dhaka', defaultZone: 'Outside Dhaka City' },
  { name: 'Gopalganj', division: 'Dhaka', defaultZone: 'Outside Dhaka City' },
  { name: 'Madaripur', division: 'Dhaka', defaultZone: 'Outside Dhaka City' },
  { name: 'Rajbari', division: 'Dhaka', defaultZone: 'Outside Dhaka City' },
  { name: 'Shariatpur', division: 'Dhaka', defaultZone: 'Outside Dhaka City' },

  // Chattogram Division
  { name: 'Chattogram', division: 'Chattogram', defaultZone: 'Outside Dhaka City' },
  { name: 'Cox\'s Bazar', division: 'Chattogram', defaultZone: 'Outside Dhaka City' },
  { name: 'Cumilla', division: 'Chattogram', defaultZone: 'Outside Dhaka City' },
  { name: 'Feni', division: 'Chattogram', defaultZone: 'Outside Dhaka City' },
  { name: 'Brahmanbaria', division: 'Chattogram', defaultZone: 'Outside Dhaka City' },
  { name: 'Noakhali', division: 'Chattogram', defaultZone: 'Outside Dhaka City' },
  { name: 'Chandpur', division: 'Chattogram', defaultZone: 'Outside Dhaka City' },
  { name: 'Lakshmipur', division: 'Chattogram', defaultZone: 'Outside Dhaka City' },
  { name: 'Rangamati', division: 'Chattogram', defaultZone: 'Outside Dhaka City' },
  { name: 'Khagrachhari', division: 'Chattogram', defaultZone: 'Outside Dhaka City' },
  { name: 'Bandarban', division: 'Chattogram', defaultZone: 'Outside Dhaka City' },

  // Sylhet Division
  { name: 'Sylhet', division: 'Sylhet', defaultZone: 'Outside Dhaka City' },
  { name: 'Moulvibazar', division: 'Sylhet', defaultZone: 'Outside Dhaka City' },
  { name: 'Habiganj', division: 'Sylhet', defaultZone: 'Outside Dhaka City' },
  { name: 'Sunamganj', division: 'Sylhet', defaultZone: 'Outside Dhaka City' },

  // Rajshahi Division
  { name: 'Rajshahi', division: 'Rajshahi', defaultZone: 'Outside Dhaka City' },
  { name: 'Bogura', division: 'Rajshahi', defaultZone: 'Outside Dhaka City' },
  { name: 'Pabna', division: 'Rajshahi', defaultZone: 'Outside Dhaka City' },
  { name: 'Sirajganj', division: 'Rajshahi', defaultZone: 'Outside Dhaka City' },
  { name: 'Naogaon', division: 'Rajshahi', defaultZone: 'Outside Dhaka City' },
  { name: 'Natore', division: 'Rajshahi', defaultZone: 'Outside Dhaka City' },
  { name: 'Chapainawabganj', division: 'Rajshahi', defaultZone: 'Outside Dhaka City' },
  { name: 'Joypurhat', division: 'Rajshahi', defaultZone: 'Outside Dhaka City' },

  // Khulna Division
  { name: 'Khulna', division: 'Khulna', defaultZone: 'Outside Dhaka City' },
  { name: 'Jashore', division: 'Khulna', defaultZone: 'Outside Dhaka City' },
  { name: 'Kushtia', division: 'Khulna', defaultZone: 'Outside Dhaka City' },
  { name: 'Jhenaidah', division: 'Khulna', defaultZone: 'Outside Dhaka City' },
  { name: 'Satkhira', division: 'Khulna', defaultZone: 'Outside Dhaka City' },
  { name: 'Bagerhat', division: 'Khulna', defaultZone: 'Outside Dhaka City' },
  { name: 'Chuadanga', division: 'Khulna', defaultZone: 'Outside Dhaka City' },
  { name: 'Meherpur', division: 'Khulna', defaultZone: 'Outside Dhaka City' },
  { name: 'Narail', division: 'Khulna', defaultZone: 'Outside Dhaka City' },
  { name: 'Magura', division: 'Khulna', defaultZone: 'Outside Dhaka City' },

  // Barishal Division
  { name: 'Barishal', division: 'Barishal', defaultZone: 'Outside Dhaka City' },
  { name: 'Patuakhali', division: 'Barishal', defaultZone: 'Outside Dhaka City' },
  { name: 'Bhola', division: 'Barishal', defaultZone: 'Outside Dhaka City' },
  { name: 'Pirojpur', division: 'Barishal', defaultZone: 'Outside Dhaka City' },
  { name: 'Barguna', division: 'Barishal', defaultZone: 'Outside Dhaka City' },
  { name: 'Jhalokathi', division: 'Barishal', defaultZone: 'Outside Dhaka City' },

  // Rangpur Division
  { name: 'Rangpur', division: 'Rangpur', defaultZone: 'Outside Dhaka City' },
  { name: 'Dinajpur', division: 'Rangpur', defaultZone: 'Outside Dhaka City' },
  { name: 'Gaibandha', division: 'Rangpur', defaultZone: 'Outside Dhaka City' },
  { name: 'Kurigram', division: 'Rangpur', defaultZone: 'Outside Dhaka City' },
  { name: 'Lalmonirhat', division: 'Rangpur', defaultZone: 'Outside Dhaka City' },
  { name: 'Nilphamari', division: 'Rangpur', defaultZone: 'Outside Dhaka City' },
  { name: 'Panchagarh', division: 'Rangpur', defaultZone: 'Outside Dhaka City' },
  { name: 'Thakurgaon', division: 'Rangpur', defaultZone: 'Outside Dhaka City' },

  // Mymensingh Division
  { name: 'Mymensingh', division: 'Mymensingh', defaultZone: 'Outside Dhaka City' },
  { name: 'Jamalpur', division: 'Mymensingh', defaultZone: 'Outside Dhaka City' },
  { name: 'Netrokona', division: 'Mymensingh', defaultZone: 'Outside Dhaka City' },
  { name: 'Sherpur', division: 'Mymensingh', defaultZone: 'Outside Dhaka City' }
];

export const DELIVERY_OPTIONS = [
  {
    id: 'Inside Dhaka City',
    label: 'Inside Dhaka City',
    price: 80,
    description: 'Home delivery within 24-48 hours'
  },
  {
    id: 'Outside Dhaka City',
    label: 'Outside Dhaka City',
    price: 150,
    description: 'Courier delivery across all 64 districts in 2-4 days'
  }
] as const;

export type DeliveryZoneOption = typeof DELIVERY_OPTIONS[number]['id'];
