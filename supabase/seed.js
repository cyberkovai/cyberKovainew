import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Supabase credentials not configured in backend/.env. Skipping seed.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const dataDir = path.join(__dirname, '../data');

function readJson(filename, fallback = []) {
  try {
    const raw = fs.readFileSync(path.join(dataDir, filename), 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

async function seed() {
  console.log('Starting Supabase seed from local data/*.json...');

  // 1. Settings
  const settings = readJson('settings.json', null);
  if (settings) {
    const { data: existing } = await supabase.from('settings').select('id').limit(1);
    if (!existing || existing.length === 0) {
      await supabase.from('settings').insert([settings]);
      console.log('Seeded settings.');
    }
  }

  // 2. Sections
  const sections = readJson('sections.json', null);
  if (sections) {
    const { data: existing } = await supabase.from('section_visibility').select('id').limit(1);
    if (!existing || existing.length === 0) {
      await supabase.from('section_visibility').insert([{ config: sections }]);
      console.log('Seeded section_visibility.');
    }
  }

  // 3. Cyber Categories
  const categories = readJson('cyber_categories.json', {});
  const catRows = Object.entries(categories).map(([id, val]) => ({
    id,
    name: val.name,
    column: val.column || 1,
    order: val.order || 1,
    badge: val.badge || '',
    icon: val.icon || '🛡️',
    short_desc: val.short_desc || '',
    services: val.services || []
  }));
  if (catRows.length > 0) {
    await supabase.from('cyber_categories').upsert(catRows, { onConflict: 'id' });
    console.log(`Seeded ${catRows.length} cyber_categories.`);
  }

  // 4. Cyber Services
  const services = readJson('cyber_services.json', {});
  const srvRows = Object.entries(services).map(([slug, val]) => ({
    slug,
    category: val.category || 'application-security',
    title: val.title || slug,
    short_desc: val.short_desc || '',
    badge: val.badge || '',
    order: val.order || 1,
    active: val.active !== false,
    nav_label: val.nav_label || '',
    footer_name: val.footer_name || '',
    icon: val.icon || '🛡️',
    tag: val.tag || '',
    stats: val.stats || [],
    overview_p1: val.overview_p1 || '',
    overview_p2: val.overview_p2 || '',
    capabilities: val.capabilities || [],
    methodology: val.methodology || [],
    deliverables: val.deliverables || [],
    faqs: val.faqs || []
  }));
  if (srvRows.length > 0) {
    await supabase.from('cyber_services').upsert(srvRows, { onConflict: 'slug' });
    console.log(`Seeded ${srvRows.length} cyber_services.`);
  }

  // 5. Cyber Practices
  const practicesData = readJson('cyber_practices.json', {});
  if (practicesData.settings) {
    const { data: existing } = await supabase.from('cyber_practices_settings').select('id').limit(1);
    if (!existing || existing.length === 0) {
      await supabase.from('cyber_practices_settings').insert([practicesData.settings]);
      console.log('Seeded cyber_practices_settings.');
    }
  }
  if (Array.isArray(practicesData.practices) && practicesData.practices.length > 0) {
    await supabase.from('cyber_practices').upsert(practicesData.practices, { onConflict: 'id' });
    console.log(`Seeded ${practicesData.practices.length} cyber_practices.`);
  }

  // 6. Investigation Services
  const invServices = readJson('investigation_services.json', []);
  if (invServices.length > 0) {
    await supabase.from('investigation_services').upsert(invServices, { onConflict: 'id' });
    console.log(`Seeded ${invServices.length} investigation_services.`);
  }

  // 7. Investigation Threats
  const threats = readJson('investigation_threats.json', []);
  if (threats.length > 0) {
    await supabase.from('investigation_threats').upsert(threats, { onConflict: 'id' });
    console.log(`Seeded ${threats.length} investigation_threats.`);
  }

  // 8. Testimonials
  const testimonials = readJson('testimonials.json', []);
  if (testimonials.length > 0) {
    await supabase.from('testimonials').upsert(testimonials, { onConflict: 'id' });
    console.log(`Seeded ${testimonials.length} testimonials.`);
  }

  // 9. Clients
  const clients = readJson('clients.json', []);
  if (clients.length > 0) {
    await supabase.from('clients').upsert(clients, { onConflict: 'id' });
    console.log(`Seeded ${clients.length} clients.`);
  }

  // 10. Accreditations
  const accreditations = readJson('accreditations.json', []);
  if (accreditations.length > 0) {
    await supabase.from('accreditations').upsert(accreditations, { onConflict: 'id' });
    console.log(`Seeded ${accreditations.length} accreditations.`);
  }

  // 11. Team
  const team = readJson('team.json', []);
  if (team.length > 0) {
    await supabase.from('team_members').upsert(team, { onConflict: 'id' });
    console.log(`Seeded ${team.length} team_members.`);
  }

  // 12. FAQs
  const faqs = readJson('faqs.json', []);
  if (faqs.length > 0) {
    await supabase.from('faqs').upsert(faqs, { onConflict: 'id' });
    console.log(`Seeded ${faqs.length} faqs.`);
  }

  // 13. Legal Policies
  const policies = readJson('legal_policies.json', {});
  const polRows = Object.values(policies);
  if (polRows.length > 0) {
    await supabase.from('legal_policies').upsert(polRows, { onConflict: 'key' });
    console.log(`Seeded ${polRows.length} legal_policies.`);
  }

  // 14. Admins
  const admins = readJson('admins.json', {});
  const adminRows = Object.values(admins);
  if (adminRows.length > 0) {
    await supabase.from('admins').upsert(adminRows, { onConflict: 'username' });
    console.log(`Seeded ${adminRows.length} admins.`);
  }

  console.log('Supabase seeding finished successfully!');
}

seed().catch(err => {
  console.error('Seed error:', err);
});

