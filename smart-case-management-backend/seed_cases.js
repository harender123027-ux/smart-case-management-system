require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const cases = [
  { title: 'Laptop Theft at MG Road Market', case_type: 'theft', priority: 'high', status: 'open', location: 'MG Road, Delhi', description: 'Complainant reported theft of a laptop from their car parked at MG Road market. Incident occurred at approximately 3 PM.', date_of_incident: '2026-03-10' },
  { title: 'Assault Near Railway Station', case_type: 'assault', priority: 'urgent', status: 'investigating', location: 'Railway Station, Chandigarh', description: 'Two individuals reportedly assaulted a commuter near the main entrance of the railway station. CCTV footage is being reviewed.', date_of_incident: '2026-03-12' },
  { title: 'Online Banking Fraud - Rs 85,000', case_type: 'fraud', priority: 'high', status: 'investigating', location: 'Sector 17, Noida', description: 'Victim received a phishing link via WhatsApp claiming to be from a bank. Rs 85,000 was fraudulently transferred within minutes.', date_of_incident: '2026-03-14' },
  { title: 'Missing Person - Priya Sharma (16 yrs)', case_type: 'missing', priority: 'urgent', status: 'open', location: 'Lajpat Nagar, Delhi', description: 'Minor girl missing since evening. Last seen wearing blue uniform outside school gates. Family has filed FIR.', date_of_incident: '2026-03-15' },
  { title: 'Two-Wheeler Accident on NH-48', case_type: 'accident', priority: 'medium', status: 'closed', location: 'NH-48, Gurgaon', description: 'Motorcycle collision with a truck near KM marker 42. Rider sustained injuries; admitted to Civil Hospital. Driver absconded.', date_of_incident: '2026-03-05' },
  { title: 'Mobile Phone Snatching at Park', case_type: 'theft', priority: 'medium', status: 'open', location: 'Lodi Garden, New Delhi', description: 'Miscreant on bicycle snatched mobile phone from a woman who was jogging. Partial description of suspect captured.', date_of_incident: '2026-03-13' },
  { title: 'Domestic Violence Complaint', case_type: 'assault', priority: 'high', status: 'investigating', location: 'Vasant Kunj, Delhi', description: 'Woman filed complaint against husband for repeated physical abuse. Medical examination conducted. Husband placed under notice.', date_of_incident: '2026-03-11' },
  { title: 'Narcotics Possession - College Campus', case_type: 'narcotics', priority: 'urgent', status: 'investigating', location: 'DU North Campus, Delhi', description: 'Student found in possession of approximately 50g of suspected cannabis. Case forwarded to Narcotic Control Bureau.', date_of_incident: '2026-03-08' },
  { title: 'Burglary at Residential Flat', case_type: 'theft', priority: 'high', status: 'open', location: 'Dwarka Sector 12, Delhi', description: 'Burglars broke into 3rd floor apartment while family was away. Jewelry worth Rs 2L and electronic items stolen.', date_of_incident: '2026-03-16' },
  { title: 'Hit and Run - Pedestrian Injured', case_type: 'accident', priority: 'urgent', status: 'investigating', location: 'Connaught Place, Delhi', description: 'Speeding car hit pedestrian crossing on red light and fled. Victim in critical condition at AIIMS. Partial plate number noted by witness.', date_of_incident: '2026-03-15' },
  { title: 'Job Scam - 12 Victims Defrauded', case_type: 'fraud', priority: 'high', status: 'investigating', location: 'Karol Bagh, Delhi', description: 'Fraudster posing as HR manager of a private firm collected Rs 10,000–15,000 from 12 job seekers. Investigation reveals multiple aliases.', date_of_incident: '2026-02-28' },
  { title: 'Missing Elderly Man - Memory Loss', case_type: 'missing', priority: 'medium', status: 'closed', location: 'Safdarjung, Delhi', description: 'Elderly man with dementia went missing from care home. Found after 18 hours near a bus stand. Family reunited.', date_of_incident: '2026-03-07' },
  { title: 'Vehicle Vandalism in Parking Lot', case_type: 'other', priority: 'low', status: 'open', location: 'Pacific Mall, Gurgaon', description: 'Multiple cars had tyres slashed in mall parking during night hours. CCTV captured a suspect in hooded clothing.', date_of_incident: '2026-03-14' },
  { title: 'Chain Snatching – Market Area', case_type: 'theft', priority: 'medium', status: 'open', location: 'Sarojini Nagar, Delhi', description: 'Woman had gold chain snatched by two motorcyclists. Description: black bike, two males, helmets, no plate visible.', date_of_incident: '2026-03-09' },
  { title: 'Fire Incident - Suspected Arson', case_type: 'other', priority: 'urgent', status: 'investigating', location: 'Hari Nagar, Delhi', description: 'Fire broke out in commercial building late at night. Fire department controlled blaze. Arson suspected. No casualties reported.', date_of_incident: '2026-03-03' },
  { title: 'Cyberstalking Complaint – Social Media', case_type: 'fraud', priority: 'medium', status: 'open', location: 'Gurugram', description: 'Victim receiving repeated threatening messages from unknown account on Instagram. Cyber crime cell has been looped in.', date_of_incident: '2026-03-12' },
  { title: 'Counterfeit Currency Seized', case_type: 'other', priority: 'high', status: 'closed', location: 'Chandni Chowk, Delhi', description: 'Shopkeeper handed over suspected fake Rs 500 notes. Initial examination confirmed forgery. Case transferred to RBI and CBI.', date_of_incident: '2026-03-01' },
  { title: 'Drunk Driving Arrest - Breathalyzer Test', case_type: 'accident', priority: 'medium', status: 'closed', location: 'Rohini, Delhi', description: 'Motorist stopped at naka check caught with 0.12 mg/L blood alcohol. Vehicle impounded, FIR registered, person arrested.', date_of_incident: '2026-03-02' },
  { title: 'Property Dispute Turning Violent', case_type: 'assault', priority: 'high', status: 'open', location: 'Mayur Vihar, Delhi', description: 'Heated property dispute between neighbours escalated. One party suffered minor injuries. Court proceedings advised.', date_of_incident: '2026-03-16' },
  { title: 'Child Labour Found at Eatery', case_type: 'other', priority: 'urgent', status: 'investigating', location: 'Paharganj, Delhi', description: 'Routine inspection found two minors aged 11 and 13 working at a roadside eatery. Children rescued and handed to Child Welfare Committee.', date_of_incident: '2026-03-06' },
];

async function seedCases() {
  console.log('🚀 Seeding 20 cases into the database...\n');
  try {
    // First get a valid user id
    const users = await pool.query('SELECT id FROM users LIMIT 1');
    const officerId = users.rows[0]?.id || null;
    if (!officerId) {
      console.error('❌ No users found in DB. Please ensure the database is set up and has at least one user.');
      process.exit(1);
    }

    for (let i = 0; i < cases.length; i++) {
      const c = cases[i];
      const case_number = `CASE-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
      await pool.query(
        `INSERT INTO cases 
          (case_number, title, description, case_type, priority, status, location, date_of_incident, assigned_officer_id, synced)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)`,
        [case_number, c.title, c.description, c.case_type, c.priority, c.status, c.location, c.date_of_incident, officerId]
      );
      console.log(`✅ [${i + 1}/20] Created: ${c.title}`);
    }

    const count = await pool.query('SELECT COUNT(*) FROM cases');
    console.log(`\n🎉 Done! Total cases in DB: ${count.rows[0].count}`);
  } catch (err) {
    console.error('Error seeding:', err.message);
  } finally {
    await pool.end();
  }
}

seedCases();
