import { sql } from './index';

async function seed() {
  console.log('Truncating medicines...');
  await sql`TRUNCATE TABLE medicines RESTART IDENTITY`;

  console.log('Inserting sample medicines...');
  await sql`
    INSERT INTO medicines (user_id, brand_name, generic_name, expiration_date, production_date, used_for, dosage, description)
    VALUES
      (1, 'Advil', 'Ibuprofen', '2026-09-20', '2024-12-01',
       'Inflammation, muscle pain, fever, headaches', '400mg tablet',
       'Take after meals to avoid stomach irritation. Avoid combining with aspirin or other NSAIDs.'),

      (1, 'Amoxil', 'Amoxicillin', '2026-12-30', '2025-03-01',
       'Broad-spectrum antibiotic for bacterial infections (respiratory, urinary, skin)', '500mg capsule',
       'Take with food to reduce stomach upset. Do not combine with methotrexate. Complete the full course even if symptoms improve.'),

      (1, 'Betadine', 'Povidone-Iodine', '2027-10-09', '2025-08-01',
       'Antiseptic for wound cleaning, minor cuts, burns', '10% solution',
       'Apply topically only. Do not ingest. Avoid use if allergic to iodine.'),

      (1, 'Biogesic', 'Paracetamol', '2027-11-15', '2025-01-01',
       'Fever reduction, mild to moderate pain relief, headaches, muscle aches', '500mg tablet',
       'Take 1 tablet every 6 hours as needed. Do not exceed 4g per day. Always take with or after food to reduce stomach irritation. Avoid alcohol to reduce risk of liver damage. Do not combine with other medicines containing acetaminophen.'),

      (1, 'Cortizone-10', 'Hydrocortisone', '2028-02-25', '2025-09-01',
       'Skin irritation, allergic rashes, insect bites', '1% cream',
       'Apply thin layer twice daily. Do not use on open wounds or infected skin.'),

      (1, 'Benadryl', 'Diphenhydramine', '2028-03-05', '2025-06-01',
       'Allergic reactions, itching, mild insomnia', '25mg capsule',
       'May cause drowsiness. Avoid alcohol and other sedatives. Do not operate machinery after taking.'),

      (1, 'Imodium', 'Loperamide', '2027-08-10', '2025-04-01',
       'Acute diarrhea, traveler''s diarrhea', '2mg capsule',
       'Take after each loose stool, maximum 8mg per day. Do not use if you have bloody diarrhea or high fever.'),

      (1, 'Zyrtec', 'Cetirizine', '2028-01-20', '2025-05-01',
       'Seasonal allergies, hay fever, allergic rhinitis', '10mg tablet',
       'Take once daily. May cause mild drowsiness. Avoid alcohol. Do not combine with other sedating antihistamines.')
  `;

  console.log('Seed complete — 8 medicines inserted.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
