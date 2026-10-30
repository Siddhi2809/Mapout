export interface StateGeo {
  name: string;
  cities: string[];
}

export const INDIAN_STATES: StateGeo[] = [
  {
    name: 'Maharashtra',
    cities: ['Pune', 'Mumbai', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad', 'Solapur', 'Kolhapur', 'Navi Mumbai'],
  },
  {
    name: 'Delhi',
    cities: ['New Delhi', 'Central Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
  },
  {
    name: 'Karnataka',
    cities: ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Davanagere', 'Ballari'],
  },
  {
    name: 'Gujarat',
    cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar'],
  },
  {
    name: 'Tamil Nadu',
    cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Erode'],
  },
  {
    name: 'Uttar Pradesh',
    cities: ['Noida', 'Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Prayagraj', 'Meerut'],
  },
  {
    name: 'Rajasthan',
    cities: ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar'],
  },
  {
    name: 'Telangana',
    cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Ramagundam', 'Khammam'],
  },
  {
    name: 'West Bengal',
    cities: ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman'],
  },
  {
    name: 'Kerala',
    cities: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad'],
  },
  {
    name: 'Madhya Pradesh',
    cities: ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar'],
  },
  {
    name: 'Haryana',
    cities: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Rohtak', 'Hisar'],
  },
  {
    name: 'Punjab',
    cities: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali'],
  },
  {
    name: 'Bihar',
    cities: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga'],
  },
  {
    name: 'Andhra Pradesh',
    cities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati'],
  },
  {
    name: 'Odisha',
    cities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri'],
  },
  {
    name: 'Jharkhand',
    cities: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar'],
  },
  {
    name: 'Chhattisgarh',
    cities: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg'],
  },
  {
    name: 'Uttarakhand',
    cities: ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur'],
  },
  {
    name: 'Goa',
    cities: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
  },
  {
    name: 'Chandigarh',
    cities: ['Chandigarh'],
  },
  {
    name: 'Himachal Pradesh',
    cities: ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Baddi'],
  },
  {
    name: 'Jammu & Kashmir',
    cities: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur'],
  },
];
