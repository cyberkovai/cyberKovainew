import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../../data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const SECURITY_DIR = path.resolve(__dirname, '../../../storage/security');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(SECURITY_DIR)) fs.mkdirSync(SECURITY_DIR, { recursive: true });

function readJson(filename, fallback = []) {
  try {
    const fullPath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(fullPath)) return fallback;
    const content = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err.message);
    return fallback;
  }
}

function writeJson(filename, data) {
  try {
    const fullPath = path.join(DATA_DIR, filename);
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 4), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filename}:`, err.message);
    return false;
  }
}

// Static rich-content snapshot generated from the PHP registry (services-data.php).
// Cached by mtime so the file is only re-parsed when it actually changes.
let staticCatalogCache = { mtime: 0, data: null };

function readStaticCatalog() {
  try {
    const fullPath = path.join(DATA_DIR, 'services_static.json');
    if (!fs.existsSync(fullPath)) return { services: {}, categories: {} };
    const stat = fs.statSync(fullPath);
    if (staticCatalogCache.data && staticCatalogCache.mtime === stat.mtimeMs) {
      return staticCatalogCache.data;
    }
    const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    staticCatalogCache = { mtime: stat.mtimeMs, data: parsed };
    return parsed;
  } catch (err) {
    console.error('Error reading services_static.json:', err.message);
    return { services: {}, categories: {} };
  }
}

function readSecurityJson(filename, fallback = {}) {
  try {
    const fullPath = path.join(SECURITY_DIR, filename);
    if (!fs.existsSync(fullPath)) return fallback;
    const content = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error reading security file ${filename}:`, err.message);
    return fallback;
  }
}

function writeSecurityJson(filename, data) {
  try {
    const fullPath = path.join(SECURITY_DIR, filename);
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 4), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing security file ${filename}:`, err.message);
    return false;
  }
}

export const storageService = {
  // ==========================================
  // SETTINGS
  // Table: settings (id, site_name, site_tagline, site_email, site_phone, site_phone_tel, site_phone_alt, site_location, site_address, working_hours, social_linkedin, social_twitter, show_team, show_testimonials, created_at, updated_at)
  // ==========================================
  async getSettings() {
    const defaultSettings = {
      site_name: 'Cyber Kovai',
      site_tagline: 'Verified Facts, Confident Decisions.',
      site_email: 'info@cyberkovai.com',
      site_phone: '+91 63820 19821',
      site_phone_tel: '+916382019821',
      site_phone_alt: '+91 98765 43210',
      site_location: 'Coimbatore, Tamil Nadu, India',
      site_address: 'Cyber Kovai Intelligence & Forensics Center, Coimbatore, Tamil Nadu, India',
      working_hours: '24/7 Incident Response & Emergency Forensics',
      social_linkedin: 'https://linkedin.com',
      social_twitter: 'https://twitter.com',
      show_team: true,
      show_testimonials: true,
      investigation_threats_title: 'Incidents & Threats We <span class="ci-grad-text">Investigate</span>',
      investigation_threats_subtitle: 'Specialized investigative capabilities across diverse cybercrime, financial fraud, and digital dispute categories.',
    };

    let dbSettings = null;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('settings').select('*').limit(1).single();
        if (!error && data) {
          dbSettings = {
            ...data,
            show_team: data.show_team === 1 || data.show_team === true,
            show_testimonials: data.show_testimonials === 1 || data.show_testimonials === true,
          };
        } else if (error) {
          console.warn('[Supabase Warning] getSettings:', error.message);
        }
      } catch (e) {
        console.warn('Supabase settings fallback:', e.message);
      }
    }
    const loaded = readJson('settings.json', defaultSettings);
    return { ...defaultSettings, ...loaded, ...(dbSettings || {}) };
  },

  async updateSettings(updated) {
    const current = await this.getSettings();
    const merged = { ...current, ...updated, updated_at: new Date().toISOString() };

    if (isSupabaseConfigured) {
      try {
        const dbPayload = {
          updated_at: merged.updated_at,
        };
        const validStringKeys = [
          'site_name', 'site_tagline', 'site_email', 'site_phone',
          'site_phone_tel', 'site_phone_alt', 'site_location', 'site_address',
          'working_hours', 'social_linkedin', 'social_twitter'
        ];
        for (const k of validStringKeys) {
          if (merged[k] !== undefined) dbPayload[k] = String(merged[k]);
        }
        if (merged.show_team !== undefined) {
          dbPayload.show_team = (merged.show_team === true || merged.show_team === 1 || merged.show_team === '1') ? 1 : 0;
        }
        if (merged.show_testimonials !== undefined) {
          dbPayload.show_testimonials = (merged.show_testimonials === true || merged.show_testimonials === 1 || merged.show_testimonials === '1') ? 1 : 0;
        }

        const { error } = await supabase.from('settings').update(dbPayload).eq('id', 1);
        if (error) {
          console.error('[Supabase Error] updateSettings failed:', error.message);
        } else {
          console.log('✅ Settings saved to Supabase settings table.');
        }

        // Two-way sync: keep section_visibility table in sync if show_team or show_testimonials were modified
        if (merged.show_team !== undefined || merged.show_testimonials !== undefined) {
          const secPayload = {};
          if (merged.show_team !== undefined) secPayload.show_team = dbPayload.show_team;
          if (merged.show_testimonials !== undefined) secPayload.show_testimonials = dbPayload.show_testimonials;
          await supabase.from('section_visibility').update(secPayload).eq('id', 1);
        }
      } catch (e) {
        console.warn('Supabase updateSettings fallback:', e.message);
      }
    }

    if (merged.show_team !== undefined || merged.show_testimonials !== undefined) {
      const curSections = readJson('sections.json', {});
      if (merged.show_team !== undefined) curSections.show_team = merged.show_team === true || merged.show_team === 1 || merged.show_team === '1';
      if (merged.show_testimonials !== undefined) curSections.show_testimonials = merged.show_testimonials === true || merged.show_testimonials === 1 || merged.show_testimonials === '1';
      writeJson('sections.json', curSections);
    }

    writeJson('settings.json', merged);
    return merged;
  },

  // ==========================================
  // SECTION VISIBILITY
  // Table: section_visibility (id, 41 boolean integer columns, updated_at)
  // ==========================================
  async getSectionVisibility() {
    const defaultSections = {
      cyber_hero: true,
      cyber_about: true,
      cyber_capabilities: true,
      cyber_stats: true,
      cyber_practices: true,
      cyber_process: true,
      cyber_industries: true,
      cyber_clients: true,
      cyber_coverage: true,
      cyber_credentials: true,
      cyber_simulator: true,
      cyber_faq: true,
      cyber_contact: true,
      inv_hero: true,
      inv_showcase: true,
      inv_services: true,
      inv_process: true,
      inv_risks: true,
      inv_credentials: true,
      inv_coverage: true,
      inv_clients: true,
      show_testimonials: true,
      inv_faq: true,
      inv_contact: true,
      about_hero: true,
      about_who_we_are: true,
      about_principles: true,
      about_cta: true,
      show_team: true,
      svc_hero: true,
      svc_overview: true,
      svc_capabilities: true,
      svc_methodology: true,
      svc_deliverables: true,
      svc_faqs: true,
      svc_related: true,
      svc_booking: true,
      contact_hero: true,
      contact_form_section: true,
      global_service_areas: true,
      global_chat_widget: true,
    };

    let config = { ...defaultSections };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('section_visibility').select('*').limit(1).single();
        if (!error && data) {
          for (const [key, val] of Object.entries(data)) {
            if (key !== 'id' && key !== 'updated_at') {
              config[key] = (val === 1 || val === true || val === '1');
            }
          }
          return config;
        } else if (error) {
          console.warn('[Supabase Warning] getSectionVisibility:', error.message);
        }
      } catch (e) {
        console.warn('Supabase section_visibility fallback:', e.message);
      }
    }

    const raw = readJson('sections.json', {});
    for (const [key, val] of Object.entries(raw)) {
      if (key !== 'id' && key !== 'updated_at') {
        config[key] = (val === 1 || val === true || val === '1');
      }
    }
    return config;
  },

  async updateSectionVisibility(newConfig) {
    const current = await this.getSectionVisibility();
    const merged = { ...current };

    const validCols = [
      'cyber_hero', 'cyber_about', 'cyber_capabilities', 'cyber_stats', 'cyber_practices',
      'cyber_process', 'cyber_industries', 'cyber_clients', 'cyber_coverage', 'cyber_credentials',
      'cyber_simulator', 'cyber_faq', 'cyber_contact', 'inv_hero', 'inv_showcase',
      'inv_services', 'inv_process', 'inv_risks', 'inv_credentials', 'inv_coverage',
      'inv_clients', 'show_testimonials', 'inv_faq', 'inv_contact', 'about_hero',
      'about_who_we_are', 'about_principles', 'about_cta', 'show_team', 'svc_hero',
      'svc_overview', 'svc_capabilities', 'svc_methodology', 'svc_deliverables', 'svc_faqs',
      'svc_related', 'svc_booking', 'contact_hero', 'contact_form_section', 'global_service_areas',
      'global_chat_widget'
    ];

    for (const col of validCols) {
      if (newConfig[col] !== undefined) {
        merged[col] = (newConfig[col] === 1 || newConfig[col] === true || newConfig[col] === '1');
      }
    }
    merged.updated_at = new Date().toISOString();

    if (isSupabaseConfigured) {
      try {
        const dbPayload = { updated_at: merged.updated_at };
        for (const col of validCols) {
          dbPayload[col] = merged[col] ? 1 : 0;
        }

        const { error } = await supabase.from('section_visibility').update(dbPayload).eq('id', 1);
        if (error) {
          console.error('[Supabase Error] updateSectionVisibility failed:', error.message);
        } else {
          console.log('✅ Section visibility saved to Supabase section_visibility table.');
        }

        // Two-way sync: keep settings table in sync if show_team or show_testimonials were modified
        if (newConfig.show_team !== undefined || newConfig.show_testimonials !== undefined) {
          const settingsPayload = {};
          if (newConfig.show_team !== undefined) {
            settingsPayload.show_team = merged.show_team ? 1 : 0;
          }
          if (newConfig.show_testimonials !== undefined) {
            settingsPayload.show_testimonials = merged.show_testimonials ? 1 : 0;
          }
          await supabase.from('settings').update(settingsPayload).eq('id', 1);
        }
      } catch (e) {
        console.warn('Supabase updateSectionVisibility fallback:', e.message);
      }
    }

    // Keep settings.json in sync as well
    if (newConfig.show_team !== undefined || newConfig.show_testimonials !== undefined) {
      const curSettings = readJson('settings.json', {});
      if (newConfig.show_team !== undefined) curSettings.show_team = merged.show_team;
      if (newConfig.show_testimonials !== undefined) curSettings.show_testimonials = merged.show_testimonials;
      writeJson('settings.json', curSettings);
    }

    writeJson('sections.json', merged);
    return merged;
  },

  // ==========================================
  // CYBER CATEGORIES
  // Tables: cyber_service_categories, cyber_service_category_map
  // ==========================================
  async getCyberCategories() {
    if (isSupabaseConfigured) {
      try {
        const { data: cats, error: catErr } = await supabase
          .from('cyber_service_categories')
          .select('*')
          .order('sort_order', { ascending: true });

        const { data: mapRows, error: mapErr } = await supabase
          .from('cyber_service_category_map')
          .select('*')
          .order('sort_order', { ascending: true });

        if (!catErr && cats && cats.length > 0) {
          const map = {};
          cats.forEach(c => {
            const serviceSlugs = (!mapErr && mapRows)
              ? mapRows.filter(m => m.category_slug === c.slug).map(m => m.service_slug)
              : [];
            map[c.slug] = {
              id: c.slug,
              name: c.name,
              column: c.col_number,
              order: c.sort_order,
              badge: c.badge || '',
              icon: c.icon || '🛡️',
              short_desc: c.short_desc || '',
              services: serviceSlugs,
            };
          });
          return map;
        }
      } catch (e) {
        console.warn('Supabase categories fallback:', e.message);
      }
    }
    return readJson('cyber_categories.json', {});
  },

  async updateCyberCategories(categories) {
    if (isSupabaseConfigured) {
      try {
        for (const [id, val] of Object.entries(categories)) {
          const catRow = {
            slug: id,
            name: val.name || id,
            col_number: Number(val.column || val.col_number) || 1,
            sort_order: Number(val.order || val.sort_order) || 1,
            badge: val.badge || '',
            icon: val.icon || '🛡️',
            short_desc: val.short_desc || '',
          };
          await supabase.from('cyber_service_categories').upsert([catRow], { onConflict: 'slug' });

          if (Array.isArray(val.services)) {
            await supabase.from('cyber_service_category_map').delete().eq('category_slug', id);
            if (val.services.length > 0) {
              const mapInserts = val.services.map((svcSlug, idx) => ({
                category_slug: id,
                service_slug: svcSlug,
                sort_order: idx + 1,
              }));
              await supabase.from('cyber_service_category_map').insert(mapInserts);
            }
          }
        }
        console.log('✅ Cyber categories saved to Supabase.');
      } catch (e) {
        console.warn('Supabase updateCyberCategories fallback:', e.message);
      }
    }
    writeJson('cyber_categories.json', categories);
    return categories;
  },

  // ==========================================
  // CYBER SERVICES
  // Stored in cyber_services.json, category mapping in cyber_service_category_map
  // ==========================================
  async getCyberServices(includeInactive = true) {
    const raw = readJson('cyber_services.json', {});
    if (includeInactive) return raw;
    const filtered = {};
    for (const [slug, item] of Object.entries(raw)) {
      if (item.active !== false && item.status !== 'inactive') filtered[slug] = item;
    }
    return filtered;
  },

  async getCyberService(slug) {
    const all = await this.getCyberServices(true);
    return all[slug] || null;
  },

  async saveCyberService(serviceData, originalSlug = null) {
    const all = await this.getCyberServices(true);
    const slug = serviceData.slug || originalSlug;
    if (originalSlug && originalSlug !== slug) {
      delete all[originalSlug];
      if (isSupabaseConfigured) {
        try {
          await supabase.from('cyber_service_category_map').delete().eq('service_slug', originalSlug);
        } catch (e) { }
      }
    }
    const now = new Date().toISOString();
    const service = {
      ...serviceData,
      slug,
      updated_at: now,
      created_at: serviceData.created_at || now,
    };
    all[slug] = service;

    if (isSupabaseConfigured) {
      try {
        if (service.category) {
          const { data: existingMap } = await supabase
            .from('cyber_service_category_map')
            .select('id')
            .eq('service_slug', slug)
            .limit(1);

          if (existingMap && existingMap.length > 0) {
            await supabase
              .from('cyber_service_category_map')
              .update({ category_slug: service.category })
              .eq('service_slug', slug);
          } else {
            await supabase
              .from('cyber_service_category_map')
              .insert([{ category_slug: service.category, service_slug: slug, sort_order: 99 }]);
          }
        }
      } catch (e) {
        console.warn('Supabase saveCyberService category map fallback:', e.message);
      }
    }
    writeJson('cyber_services.json', all);
    return service;
  },

  async deleteCyberService(slug) {
    const all = await this.getCyberServices(true);
    if (!all[slug]) return false;
    delete all[slug];
    if (isSupabaseConfigured) {
      try {
        await supabase.from('cyber_service_category_map').delete().eq('service_slug', slug);
      } catch (e) { }
    }
    writeJson('cyber_services.json', all);
    return true;
  },

  // ==========================================
  // CYBER PRACTICES
  // Table: cyber_practices (id, practice_id, code, title, slug, link, tag, badge, status_text, icon, is_hero, description, sort_order, status, created_at, updated_at)
  // Constraint: UNIQUE (slug)
  // ==========================================
  async getCyberPracticesSettings() {
    const settingsData = readJson('cyber_practices_settings.json', null);
    if (settingsData && typeof settingsData === 'object' && Object.keys(settingsData).length > 0) {
      return {
        tag: settingsData.tag || settingsData.badge || 'OUR PRACTICES',
        title: settingsData.title || 'Core Cyber Practices. One Standard: <span>Uncompromising Defense.</span>',
        subtitle: settingsData.subtitle || settingsData.subtext || 'Comprehensive offensive and defensive cybersecurity practices engineered for modern digital enterprises.',
        ...settingsData
      };
    }
    const fileData = readJson('cyber_practices.json', null);
    if (fileData && !Array.isArray(fileData) && fileData.settings) {
      return {
        tag: fileData.settings.tag || fileData.settings.badge || 'OUR PRACTICES',
        title: fileData.settings.title || 'Core Cyber Practices. One Standard: <span>Uncompromising Defense.</span>',
        subtitle: fileData.settings.subtitle || fileData.settings.subtext || 'Comprehensive offensive and defensive cybersecurity practices engineered for modern digital enterprises.',
        ...fileData.settings
      };
    }
    return {
      tag: 'OUR PRACTICES',
      title: 'Core Cyber Practices. One Standard: <span>Uncompromising Defense.</span>',
      subtitle: 'Comprehensive offensive and defensive cybersecurity practices engineered for modern digital enterprises.',
    };
  },

  async saveCyberPracticesSettings(settings) {
    const current = await this.getCyberPracticesSettings();
    const updated = {
      tag: (settings.tag !== undefined ? settings.tag : current.tag) || 'OUR PRACTICES',
      title: (settings.title !== undefined ? settings.title : current.title) || 'Core Cyber Practices. One Standard: <span>Uncompromising Defense.</span>',
      subtitle: (settings.subtitle !== undefined ? settings.subtitle : current.subtitle) || 'Comprehensive offensive and defensive cybersecurity practices engineered for modern digital enterprises.',
      updated_at: new Date().toISOString()
    };
    writeJson('cyber_practices_settings.json', updated);
    return updated;
  },

  async getCyberPractices(includeInactive = true) {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('cyber_practices').select('*').order('sort_order', { ascending: true });
        if (!includeInactive) query = query.eq('status', 'active');
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((p, idx) => ({
            id: p.practice_id || String(p.id || idx + 1),
            code: p.code || String(idx + 1).padStart(2, '0'),
            title: p.title || '',
            slug: p.slug || '',
            link: p.link || '',
            tag: p.tag || '',
            badge: p.badge || '',
            status_text: p.status_text || 'ARMORED',
            icon: p.icon || '🛡️',
            is_hero: p.is_hero === 1,
            description: p.description || '',
            order: Number(p.sort_order) || idx + 1,
            status: p.status || 'active',
            active: p.status === 'active',
            created_at: p.created_at,
            updated_at: p.updated_at,
          }));
        }
      } catch (e) {
        console.warn('Supabase cyber_practices fallback:', e.message);
      }
    }

    const fileData = readJson('cyber_practices.json', []);
    let list = Array.isArray(fileData) ? fileData : (fileData && Array.isArray(fileData.practices) ? fileData.practices : []);

    const normalized = list.map((p, idx) => {
      const isActive = p.status ? p.status === 'active' : p.active !== false;
      return {
        ...p,
        id: String(p.id ?? (idx + 1)),
        order: p.order !== undefined && p.order !== null ? Number(p.order) : (idx + 1),
        title: p.title || '',
        code: p.code || String(idx + 1).padStart(2, '0'),
        slug: p.slug || '',
        link: p.link || (p.slug ? `services/${p.slug}.php` : ''),
        tag: p.tag || `// SEC-${String(idx + 1).padStart(2, '0')}`,
        badge: p.badge || '',
        status_text: p.status_text || 'ARMORED',
        icon: p.icon || '🛡️',
        is_hero: Boolean(p.is_hero),
        status: isActive ? 'active' : 'inactive',
        active: isActive,
        description: p.description || '',
      };
    });

    normalized.sort((a, b) => (a.order || 0) - (b.order || 0));
    return includeInactive ? normalized : normalized.filter(p => p.active);
  },

  async saveCyberPractice(practiceData, id = null) {
    const list = await this.getCyberPractices(true);
    const practiceId = String(id || practiceData.id || (list.reduce((max, item) => Math.max(max, parseInt(item.id, 10) || 0), 0) + 1));

    const isActive = practiceData.status !== undefined
      ? practiceData.status === 'active'
      : (practiceData.active !== undefined ? Boolean(practiceData.active) : true);

    const title = (practiceData.title || '').trim();
    const slug = (practiceData.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')).trim();
    const order = practiceData.order !== undefined && practiceData.order !== '' ? Number(practiceData.order) : (list.length + 1);

    const item = {
      id: practiceId,
      code: practiceData.code || String(practiceId).padStart(2, '0'),
      title: title,
      slug: slug,
      link: practiceData.link || (slug ? `services/${slug}.php` : ''),
      tag: practiceData.tag || `// ${slug.replace(/[^a-zA-Z]/g, '').substring(0, 6).toUpperCase()}-${String(practiceId).padStart(2, '0')}`,
      badge: practiceData.badge || '',
      status_text: practiceData.status_text || 'ARMORED',
      icon: practiceData.icon || '🛡️',
      is_hero: Boolean(practiceData.is_hero),
      order: order,
      status: isActive ? 'active' : 'inactive',
      active: isActive,
      description: (practiceData.description || '').trim(),
      updated_at: new Date().toISOString(),
    };

    const idx = list.findIndex(p => String(p.id) === String(practiceId) || p.slug === slug);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    list.sort((a, b) => (a.order || 0) - (b.order || 0));
    writeJson('cyber_practices.json', list);

    if (isSupabaseConfigured) {
      try {
        const dbRow = {
          practice_id: String(practiceId),
          code: item.code,
          title: item.title,
          slug: item.slug,
          link: item.link,
          tag: item.tag,
          badge: item.badge,
          status_text: item.status_text,
          icon: item.icon,
          is_hero: item.is_hero ? 1 : 0,
          description: item.description,
          sort_order: item.order,
          status: item.status,
          updated_at: item.updated_at,
        };
        const { error } = await supabase.from('cyber_practices').upsert([dbRow], { onConflict: 'slug' });
        if (error) {
          console.error('[Supabase Error] saveCyberPractice:', error.message);
        } else {
          console.log(`✅ Cyber Practice [${slug}] saved to Supabase.`);
        }
      } catch (e) {
        console.warn('Supabase saveCyberPractice fallback:', e.message);
      }
    }
    return item;
  },

  async deleteCyberPractice(id) {
    const list = await this.getCyberPractices(true);
    const item = list.find(p => String(p.id) === String(id) || p.slug === id);
    const updated = list.filter(p => String(p.id) !== String(id) && p.slug !== id);
    writeJson('cyber_practices.json', updated);

    if (isSupabaseConfigured && item) {
      try {
        await supabase.from('cyber_practices').delete().or(`practice_id.eq.${item.id},slug.eq.${item.slug}`);
      } catch (e) {
        console.warn('Supabase deleteCyberPractice fallback:', e.message);
      }
    }
    return true;
  },

  async toggleCyberPracticeStatus(id) {
    const list = await this.getCyberPractices(true);
    const item = list.find(p => String(p.id) === String(id) || p.slug === id);
    if (!item) return null;

    const newActive = !item.active;
    item.active = newActive;
    item.status = newActive ? 'active' : 'inactive';
    item.updated_at = new Date().toISOString();

    writeJson('cyber_practices.json', list);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('cyber_practices')
          .update({ status: item.status, updated_at: item.updated_at })
          .or(`practice_id.eq.${item.id},slug.eq.${item.slug}`);
      } catch (e) {
        console.warn('Supabase toggleCyberPracticeStatus fallback:', e.message);
      }
    }
    return item;
  },

  // ==========================================
  // INVESTIGATION SERVICES
  // Table: investigation_services (id, service_id, slug, title, short, footer_name, icon, image, description, overview, sort_order, status, created_at, updated_at)
  // Constraint: UNIQUE (slug)
  // ==========================================
  async getInvestigationServices(includeInactive = true) {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('investigation_services').select('*').order('sort_order', { ascending: true });
        if (!includeInactive) query = query.eq('status', 'active');
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map(s => ({
            id: s.service_id || String(s.id),
            service_id: s.service_id || String(s.id),
            slug: s.slug,
            title: s.title,
            short: s.short || s.title,
            footer_name: s.footer_name || s.short || s.title,
            icon: s.icon || '🛡️',
            image: s.image || '',
            description: s.description || '',
            overview: s.overview || '',
            order: Number(s.sort_order) || 1,
            sort_order: Number(s.sort_order) || 1,
            status: s.status || 'active',
            active: s.status === 'active',
            created_at: s.created_at,
            updated_at: s.updated_at,
          }));
        }
      } catch (e) {
        console.warn('Supabase investigation_services fallback:', e.message);
      }
    }
    const list = readJson('investigation_services.json', []);
    const sorted = [...list].sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));
    return includeInactive ? sorted : sorted.filter(s => (s.status ? s.status === 'active' : s.active !== false));
  },

  async getInvestigationService(slug) {
    const all = await this.getInvestigationServices(true);
    return all.find(s => s.slug === slug || s.id === slug) || null;
  },

  // FULL SERVICE CATALOG (PHP services-data.php parity)
  async getServiceCatalog() {
    const staticData = readStaticCatalog();
    const services = { ...(staticData.services || {}) };
    const categories = JSON.parse(JSON.stringify(staticData.categories || {}));

    const storedCyber = readJson('cyber_services.json', {});
    for (const [slug, data] of Object.entries(storedCyber || {})) {
      if (data && data.status && data.status !== 'active') continue;
      services[slug] = { ...(services[slug] || {}), ...data };
    }

    const storedCats = await this.getCyberCategories();
    for (const [key, catData] of Object.entries(storedCats || {})) {
      if (!categories[key]) categories[key] = { ...catData };
      const list = [];
      for (const [slug, svc] of Object.entries(services)) {
        if ((svc.category || '') === key && (!svc.status || svc.status === 'active')) {
          list.push(slug);
        }
      }
      categories[key].services = list;
    }

    let storedInv = await this.getInvestigationServices(false);
    if (storedInv.length > 0) {
      const invSlugs = [];
      for (const inv of storedInv) {
        const slug = inv.slug;
        if (!slug) continue;
        invSlugs.push(slug);
        if (!services[slug]) {
          services[slug] = {
            title: inv.title,
            nav_label: inv.short || inv.title,
            category: 'digital-investigations',
            badge: 'SPECIALIZED INVESTIGATION',
            tagline: inv.short || inv.title,
            short_desc: inv.description || '',
            overview: inv.overview || inv.description || '',
            why_needed: 'Professional investigative support is critical when confronting cyber threats or digital legal proceedings.',
            image: inv.image || 'assets/images/investigation_01_victim_recovery.jpg',
            key_features: [],
            deliverables: [],
            status: inv.status || 'active',
          };
        } else {
          services[slug].title = inv.title;
          services[slug].short_desc = inv.description || services[slug].short_desc || '';
          if (inv.image) services[slug].image = inv.image;
        }
      }
      if (categories['digital-investigations']) {
        categories['digital-investigations'].services = invSlugs;
      }
    }

    return { services, categories };
  },

  async getFullService(slug) {
    const catalog = await this.getServiceCatalog();
    let currentSlug = slug;
    let service = catalog.services[currentSlug] || null;

    if (!service) {
      currentSlug = 'vulnerability-assessment-penetration-testing';
      service = catalog.services[currentSlug] || null;
    }
    if (!service) return null;

    const categorySlug = service.category || 'application-security';
    const category = catalog.categories[categorySlug] || {
      name: 'Cyber Security',
      badge: 'SPECIALIZED SECURITY',
      icon: '🛡️',
    };

    const categoryServices = (catalog.categories[categorySlug] && catalog.categories[categorySlug].services) || [];
    const related = [];
    for (const relSlug of categoryServices) {
      if (relSlug === currentSlug) continue;
      const rel = catalog.services[relSlug];
      if (!rel) continue;
      related.push({
        slug: relSlug,
        title: rel.title,
        short_desc: rel.short_desc || '',
        category: rel.category || categorySlug,
      });
      if (related.length >= 4) break;
    }

    return { slug: currentSlug, service, category, categorySlug, related };
  },

  async saveInvestigationService(data, originalSlug = null) {
    const list = readJson('investigation_services.json', []);
    const slug = data.slug || originalSlug || data.id;
    const status = data.status || (data.active !== false ? 'active' : 'inactive');
    const active = status === 'active';
    const order = data.order !== undefined && data.order !== '' ? Number(data.order) : (list.length + 1);
    const serviceId = String(data.service_id || data.id || (list.length + 1));
    const now = new Date().toISOString();

    const item = {
      ...data,
      id: serviceId,
      service_id: serviceId,
      slug,
      status,
      active,
      order,
      updated_at: now,
    };

    const idx = list.findIndex(s => s.slug === (originalSlug || slug));
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    writeJson('investigation_services.json', list);

    if (isSupabaseConfigured) {
      try {
        const dbRow = {
          service_id: serviceId,
          slug: slug,
          title: item.title || '',
          short: item.short || item.footer_name || item.title || '',
          footer_name: item.footer_name || item.short || item.title || '',
          icon: item.icon || '🛡️',
          image: item.image || '',
          description: item.description || '',
          overview: item.overview || '',
          sort_order: order,
          status: status,
          updated_at: now,
        };
        const { error } = await supabase.from('investigation_services').upsert([dbRow], { onConflict: 'slug' });
        if (error) {
          console.error('[Supabase Error] saveInvestigationService:', error.message);
        } else {
          console.log(`✅ Investigation Service [${slug}] saved to Supabase.`);
        }
      } catch (e) {
        console.warn('Supabase saveInvestigationService fallback:', e.message);
      }
    }
    return item;
  },

  async deleteInvestigationService(slug) {
    let list = readJson('investigation_services.json', []);
    list = list.filter(s => s.slug !== slug && s.id !== slug);
    writeJson('investigation_services.json', list);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('investigation_services').delete().or(`slug.eq.${slug},service_id.eq.${slug}`);
      } catch (e) {
        console.warn('Supabase deleteInvestigationService fallback:', e.message);
      }
    }
    return true;
  },

  async toggleInvestigationServiceStatus(slug) {
    const list = readJson('investigation_services.json', []);
    const item = list.find(s => s.slug === slug || s.id === slug);
    if (!item) return null;
    const isCurrentlyActive = item.status ? item.status === 'active' : item.active !== false;
    const nextActive = !isCurrentlyActive;
    item.active = nextActive;
    item.status = nextActive ? 'active' : 'inactive';
    item.updated_at = new Date().toISOString();
    writeJson('investigation_services.json', list);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('investigation_services')
          .update({ status: item.status, updated_at: item.updated_at })
          .or(`slug.eq.${slug},service_id.eq.${slug}`);
      } catch (e) {
        console.warn('Supabase toggleInvestigationServiceStatus fallback:', e.message);
      }
    }
    return item;
  },

  // ==========================================
  // INVESTIGATION THREATS
  // Table: investigation_threats (id, threat_id, text, size, accent, sort_order, status, created_at, updated_at)
  // ==========================================
  async getInvestigationThreats(includeInactive = true) {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('investigation_threats').select('*').order('sort_order', { ascending: true });
        if (!includeInactive) query = query.eq('status', 'active');
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map(t => ({
            id: t.threat_id || String(t.id),
            threat_id: t.threat_id || String(t.id),
            text: t.text,
            name: t.text,
            size: t.size,
            accent: t.accent,
            order: Number(t.sort_order) || 1,
            sort_order: Number(t.sort_order) || 1,
            status: t.status,
            active: t.status === 'active',
            created_at: t.created_at,
            updated_at: t.updated_at,
          }));
        }
      } catch (e) {
        console.warn('Supabase investigation_threats fallback:', e.message);
      }
    }
    const list = readJson('investigation_threats.json', []);
    const sorted = [...list].sort((a, b) => (parseInt(a.order, 10) || 0) - (parseInt(b.order, 10) || 0));
    return includeInactive ? sorted : sorted.filter(t => (t.status ? t.status === 'active' : t.active !== false));
  },

  async saveInvestigationThreat(data, id = null) {
    const list = readJson('investigation_threats.json', []);
    let threatId = id || data.id;
    if (!threatId) {
      let maxId = 0;
      for (const item of list) {
        const num = parseInt(item.id, 10);
        if (!isNaN(num)) maxId = Math.max(maxId, num);
      }
      threatId = String(maxId + 1);
    } else {
      threatId = String(threatId);
    }

    const validSizes = ['xl', 'lg', 'md', 'sm'];
    const validAccents = ['purple', 'cyan', 'emerald', 'amber', 'rose'];

    const size = validSizes.includes(data.size) ? data.size : 'md';
    const accent = validAccents.includes(data.accent) ? data.accent : 'purple';
    const text = (data.text || data.name || '').trim();
    const status = data.status === 'inactive' || data.active === false ? 'inactive' : 'active';
    const order = data.order !== undefined && data.order !== '' ? parseInt(data.order, 10) : list.length + 1;
    const now = new Date().toISOString();

    const item = {
      ...data,
      id: threatId,
      threat_id: threatId,
      text: text,
      name: text,
      size: size,
      accent: accent,
      order: isNaN(order) ? list.length + 1 : order,
      status: status,
      active: status === 'active',
      updated_at: now,
    };

    const idx = list.findIndex(t => String(t.id) === String(threatId));
    if (idx >= 0) {
      item.created_at = list[idx].created_at || now;
      list[idx] = { ...list[idx], ...item };
    } else {
      item.created_at = now;
      list.push(item);
    }
    writeJson('investigation_threats.json', list);

    if (isSupabaseConfigured) {
      try {
        const dbRow = {
          threat_id: threatId,
          text: text,
          size: size,
          accent: accent,
          sort_order: isNaN(order) ? 1 : order,
          status: status,
          updated_at: now,
        };
        const { data: existing } = await supabase
          .from('investigation_threats')
          .select('id')
          .eq('threat_id', threatId)
          .limit(1);

        if (existing && existing.length > 0) {
          await supabase.from('investigation_threats').update(dbRow).eq('threat_id', threatId);
        } else {
          await supabase.from('investigation_threats').insert([dbRow]);
        }
        console.log(`✅ Investigation Threat [${text}] saved to Supabase.`);
      } catch (e) {
        console.warn('Supabase saveInvestigationThreat fallback:', e.message);
      }
    }
    return item;
  },

  async deleteInvestigationThreat(id) {
    let list = readJson('investigation_threats.json', []);
    list = list.filter(t => String(t.id) !== String(id));
    writeJson('investigation_threats.json', list);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('investigation_threats').delete().eq('threat_id', String(id));
      } catch (e) {
        console.warn('Supabase deleteInvestigationThreat fallback:', e.message);
      }
    }
    return true;
  },

  async toggleInvestigationThreatStatus(id) {
    const list = readJson('investigation_threats.json', []);
    const item = list.find(t => String(t.id) === String(id));
    if (!item) return null;
    const curStatus = item.status || (item.active !== false ? 'active' : 'inactive');
    const newStatus = curStatus === 'active' ? 'inactive' : 'active';
    item.status = newStatus;
    item.active = newStatus === 'active';
    item.updated_at = new Date().toISOString();
    writeJson('investigation_threats.json', list);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('investigation_threats')
          .update({ status: newStatus, updated_at: item.updated_at })
          .eq('threat_id', String(id));
      } catch (e) {
        console.warn('Supabase toggleInvestigationThreatStatus fallback:', e.message);
      }
    }
    return item;
  },

  // ==========================================
  // TESTIMONIALS
  // Table: testimonials (id, testi_id, quote, name, role, avatar, rating, tag, sort_order, status, created_at, updated_at)
  // Constraint: UNIQUE (testi_id)
  // Testimonials are managed and fetched exclusively from Supabase
  // ==========================================
  async getTestimonials(includeInactive = true) {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('testimonials').select('*').order('sort_order', { ascending: true });
        if (!includeInactive) query = query.eq('status', 'active');
        const { data, error } = await query;
        if (error) {
          console.error('[Supabase Error] getTestimonials:', error.message);
          return [];
        }
        if (Array.isArray(data)) {
          return data.map(t => ({
            id: t.testi_id || String(t.id),
            testi_id: t.testi_id || String(t.id),
            name: t.name,
            role: t.role || '',
            quote: t.quote || '',
            content: t.quote || '',
            avatar: t.avatar || 'assets/images/avatar_karthik.jpg',
            rating: Number(t.rating) || 5,
            tag: t.tag || 'Digital Forensics',
            order: Number(t.sort_order) || 1,
            sort_order: Number(t.sort_order) || 1,
            status: t.status || 'active',
            active: t.status === 'active',
            created_at: t.created_at,
            updated_at: t.updated_at,
          }));
        }
      } catch (e) {
        console.warn('[Supabase Exception] getTestimonials:', e.message);
        return [];
      }
    }
    return [];
  },

  async saveTestimonial(data, id = null) {
    const testId = id || data.id || data.testi_id || `testi-${Date.now()}`;
    const isActive = data.status !== undefined ? (data.status === 'active') : (data.active !== false);
    const now = new Date().toISOString();
    const item = {
      ...data,
      id: testId,
      testi_id: testId,
      name: data.name || '',
      role: data.role || data.company || '',
      quote: data.quote || data.content || '',
      content: data.quote || data.content || '',
      tag: data.tag || data.track || 'Digital Forensics',
      rating: data.rating !== undefined ? Number(data.rating) : 5,
      avatar: data.avatar || 'assets/images/avatar_karthik.jpg',
      order: data.order !== undefined ? Number(data.order) : 1,
      sort_order: data.order !== undefined ? Number(data.order) : 1,
      status: isActive ? 'active' : 'inactive',
      active: isActive,
      updated_at: now,
    };

    if (isSupabaseConfigured) {
      try {
        const dbRow = {
          testi_id: String(testId),
          quote: item.quote,
          name: item.name,
          role: item.role,
          avatar: item.avatar,
          rating: item.rating,
          tag: item.tag,
          sort_order: item.order,
          status: item.status,
          updated_at: now,
        };
        const { error } = await supabase.from('testimonials').upsert([dbRow], { onConflict: 'testi_id' });
        if (error) {
          console.error('[Supabase Error] saveTestimonial:', error.message);
          throw new Error(error.message);
        } else {
          console.log(`✅ Testimonial [${item.name}] saved to Supabase.`);
        }
      } catch (e) {
        console.warn('Supabase saveTestimonial error:', e.message);
        throw e;
      }
    }
    return item;
  },

  async deleteTestimonial(id) {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('testimonials').delete().eq('testi_id', String(id));
        if (error) {
          console.error('[Supabase Error] deleteTestimonial:', error.message);
          throw new Error(error.message);
        }
        console.log(`✅ Testimonial [${id}] deleted from Supabase.`);
      } catch (e) {
        console.warn('Supabase deleteTestimonial error:', e.message);
        throw e;
      }
    }
    return true;
  },

  async toggleTestimonialStatus(id) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('testi_id', String(id))
          .single();

        if (error || !data) {
          console.error('[Supabase Error] toggleTestimonialStatus fetch:', error?.message);
          throw new Error(error?.message || 'Testimonial not found in Supabase');
        }

        const nextStatus = data.status === 'active' ? 'inactive' : 'active';
        const updatedAt = new Date().toISOString();
        const { error: updateError } = await supabase
          .from('testimonials')
          .update({ status: nextStatus, updated_at: updatedAt })
          .eq('testi_id', String(id));

        if (updateError) {
          console.error('[Supabase Error] toggleTestimonialStatus update:', updateError.message);
          throw new Error(updateError.message);
        }

        return {
          id: data.testi_id,
          testi_id: data.testi_id,
          name: data.name,
          role: data.role,
          quote: data.quote,
          content: data.quote,
          avatar: data.avatar,
          rating: Number(data.rating) || 5,
          tag: data.tag,
          order: Number(data.sort_order) || 1,
          sort_order: Number(data.sort_order) || 1,
          status: nextStatus,
          active: nextStatus === 'active',
          updated_at: updatedAt,
        };
      } catch (e) {
        console.warn('Supabase toggleTestimonialStatus error:', e.message);
        throw e;
      }
    }
    return null;
  },

  // ==========================================
  // CLIENTS
  // Table: clients (id, client_id, name, category, desc, img, alt, website, track, sort_order, status, created_at, updated_at)
  // Constraint: UNIQUE (client_id)
  // ==========================================
  async getClients(track = 'all', includeInactive = true) {
    const wanted = track === 'forensics' ? 'investigation' : track;
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('clients').select('*').order('sort_order', { ascending: true });
        if (wanted !== 'all') {
          if (wanted === 'investigation') {
            query = query.or('track.eq.investigation,track.eq.both');
          } else if (wanted === 'cyber') {
            query = query.or('track.eq.cyber,track.eq.both');
          }
        }
        if (!includeInactive) query = query.eq('status', 'active');
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map(c => ({
            id: c.client_id || String(c.id),
            client_id: c.client_id || String(c.id),
            name: c.name,
            category: c.category || '',
            desc: c.desc || '',
            description: c.desc || '',
            img: c.img || '',
            image: c.img || '',
            alt: c.alt || c.name || '',
            website: c.website || '',
            track: c.track || 'both',
            order: Number(c.sort_order) || 1,
            sort_order: Number(c.sort_order) || 1,
            status: c.status || 'active',
            active: c.status === 'active',
            created_at: c.created_at,
            updated_at: c.updated_at,
          }));
        }
      } catch (e) {
        console.warn('Supabase clients fallback:', e.message);
      }
    }
    let list = readJson('clients.json', []);
    if (!includeInactive) list = list.filter(c => (c.status ? c.status === 'active' : c.active !== false));
    if (wanted !== 'all') {
      list = list.filter(c => {
        const itemTrack = c.track || 'both';
        if (wanted === 'investigation') {
          return itemTrack === 'investigation' || itemTrack === 'forensics' || itemTrack === 'both' || itemTrack === 'all';
        }
        if (wanted === 'cyber') {
          return itemTrack === 'cyber' || itemTrack === 'both' || itemTrack === 'all';
        }
        return true;
      });
    }
    list = list.map(c => ({
      ...c,
      active: c.status ? c.status === 'active' : c.active !== false,
      status: c.status || (c.active !== false ? 'active' : 'inactive'),
      order: Number(c.order) || 1
    }));
    list.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    return list;
  },

  async saveClient(data, id = null) {
    const list = readJson('clients.json', []);
    const clientId = id || data.id || `client-${Date.now()}`;
    const isActive = data.status ? data.status === 'active' : data.active !== false;
    const now = new Date().toISOString();
    const item = {
      ...data,
      id: clientId,
      client_id: clientId,
      status: isActive ? 'active' : 'inactive',
      active: isActive,
      order: data.order !== undefined && data.order !== null ? Number(data.order) : 1,
      updated_at: now,
    };

    const idx = list.findIndex(c => String(c.id) === String(clientId));
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    writeJson('clients.json', list);

    if (isSupabaseConfigured) {
      try {
        const dbRow = {
          client_id: String(clientId),
          name: item.name || '',
          category: item.category || '',
          desc: item.desc || item.description || '',
          img: item.img || item.image || '',
          alt: item.alt || item.name || '',
          website: item.website || '',
          track: ['investigation', 'cyber', 'both'].includes(item.track) ? item.track : 'both',
          sort_order: item.order,
          status: item.status,
          updated_at: now,
        };
        const { error } = await supabase.from('clients').upsert([dbRow], { onConflict: 'client_id' });
        if (error) {
          console.error('[Supabase Error] saveClient:', error.message);
        } else {
          console.log(`✅ Client [${item.name}] saved to Supabase.`);
        }
      } catch (e) {
        console.warn('Supabase saveClient fallback:', e.message);
      }
    }
    return item;
  },

  async deleteClient(id) {
    let list = readJson('clients.json', []);
    list = list.filter(c => String(c.id) !== String(id));
    writeJson('clients.json', list);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('clients').delete().eq('client_id', String(id));
      } catch (e) {
        console.warn('Supabase deleteClient fallback:', e.message);
      }
    }
    return true;
  },

  async toggleClientStatus(id) {
    const list = readJson('clients.json', []);
    const item = list.find(c => String(c.id) === String(id));
    if (!item) return null;
    const isCurrentlyActive = item.status ? item.status === 'active' : item.active !== false;
    item.active = !isCurrentlyActive;
    item.status = item.active ? 'active' : 'inactive';
    item.updated_at = new Date().toISOString();
    writeJson('clients.json', list);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('clients')
          .update({ status: item.status, updated_at: item.updated_at })
          .eq('client_id', String(id));
      } catch (e) {
        console.warn('Supabase toggleClientStatus fallback:', e.message);
      }
    }
    return item;
  },

  // ==========================================
  // ACCREDITATIONS
  // Table: accreditations (id, accred_id, name, short_name, img, alt, website, track, sort_order, status, created_at, updated_at)
  // Constraint: UNIQUE (accred_id)
  // ==========================================
  async getAccreditations(track = 'all', includeInactive = true) {
    const wanted = track === 'forensics' ? 'investigation' : track;
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('accreditations').select('*').order('sort_order', { ascending: true });
        if (wanted !== 'all') {
          if (wanted === 'investigation') {
            query = query.or('track.eq.investigation,track.eq.both');
          } else if (wanted === 'cyber') {
            query = query.or('track.eq.cyber,track.eq.both');
          }
        }
        if (!includeInactive) query = query.eq('status', 'active');
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map(a => ({
            id: a.accred_id || String(a.id),
            accred_id: a.accred_id || String(a.id),
            name: a.name,
            short_name: a.short_name || '',
            img: (a.img || '').includes('accred_1794298501_1bca47')
              ? 'assets/images/aid.png'
              : (a.img || '').includes('accred_1794298552_96db9e')
                ? 'assets/images/tapdi.png'
                : a.img || '',
            alt: a.alt || a.name || '',
            website: a.website || '',
            track: a.track || 'both',
            order: Number(a.sort_order) || 1,
            sort_order: Number(a.sort_order) || 1,
            status: a.status || 'active',
            active: a.status === 'active',
            created_at: a.created_at,
            updated_at: a.updated_at,
          }));
        }
      } catch (e) {
        console.warn('Supabase accreditations fallback:', e.message);
      }
    }

    const matchesTrack = (item) => {
      if (!wanted || wanted === 'all') return true;
      const itemTrack = item.track || 'both';
      if (wanted === 'investigation') {
        return itemTrack === 'investigation' || itemTrack === 'forensics' || itemTrack === 'both' || itemTrack === 'all';
      }
      if (wanted === 'cyber') {
        return itemTrack === 'cyber' || itemTrack === 'both' || itemTrack === 'all';
      }
      return itemTrack === wanted || itemTrack === 'both' || itemTrack === 'all';
    };
    const isVisible = (item) => {
      if (item.status) return item.status === 'active';
      return item.active !== false;
    };

    let list = readJson('accreditations.json', []);
    list = list.filter(matchesTrack);
    if (!includeInactive) list = list.filter(isVisible);
    list.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    return list;
  },

  async saveAccreditation(data, id = null) {
    const list = readJson('accreditations.json', []);
    const accId = id || data.id || `accred-${Date.now()}`;
    const idx = list.findIndex(a => String(a.id) === String(accId));
    const existing = idx >= 0 ? list[idx] : {};

    const name = String(data.name ?? existing.name ?? data.title ?? '').trim();
    const shortName = String(data.short_name ?? existing.short_name ?? data.code ?? '').trim();
    const rawTrack = data.track ?? existing.track ?? 'both';
    const track = ['investigation', 'cyber', 'both'].includes(rawTrack)
      ? rawTrack
      : (rawTrack === 'forensics' ? 'investigation' : 'both');
    const status = (data.status === 'inactive' || data.active === false) ? 'inactive' : 'active';
    const order = Number(data.order ?? existing.order ?? (list.length + 1)) || 1;
    const img = String(data.img ?? existing.img ?? 'assets/images/aid.png').trim();
    const alt = String(data.alt ?? existing.alt ?? (shortName ? `${shortName} - ${name}` : name)).trim();
    const now = new Date().toISOString();

    const item = {
      ...existing,
      ...data,
      id: accId,
      accred_id: accId,
      name,
      short_name: shortName,
      img,
      alt,
      website: String(data.website ?? existing.website ?? '').trim(),
      track,
      order,
      status,
      active: status === 'active',
      updated_at: now,
    };
    if (idx < 0) item.created_at = now;

    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    writeJson('accreditations.json', list);

    if (isSupabaseConfigured) {
      try {
        const dbRow = {
          accred_id: String(accId),
          name: item.name,
          short_name: item.short_name,
          img: item.img,
          alt: item.alt,
          website: item.website,
          track: item.track,
          sort_order: item.order,
          status: item.status,
          updated_at: now,
        };
        const { error } = await supabase.from('accreditations').upsert([dbRow], { onConflict: 'accred_id' });
        if (error) {
          console.error('[Supabase Error] saveAccreditation:', error.message);
        } else {
          console.log(`✅ Accreditation [${item.name}] saved to Supabase.`);
        }
      } catch (e) {
        console.warn('Supabase saveAccreditation fallback:', e.message);
      }
    }
    return item;
  },

  async deleteAccreditation(id) {
    let list = readJson('accreditations.json', []);
    list = list.filter(a => String(a.id) !== String(id));
    writeJson('accreditations.json', list);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('accreditations').delete().eq('accred_id', String(id));
      } catch (e) {
        console.warn('Supabase deleteAccreditation fallback:', e.message);
      }
    }
    return true;
  },

  async toggleAccreditationStatus(id) {
    const list = readJson('accreditations.json', []);
    const item = list.find(a => String(a.id) === String(id));
    if (!item) return null;
    const currentlyActive = item.status ? item.status === 'active' : item.active !== false;
    item.status = currentlyActive ? 'inactive' : 'active';
    item.active = item.status === 'active';
    item.updated_at = new Date().toISOString();
    writeJson('accreditations.json', list);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('accreditations')
          .update({ status: item.status, updated_at: item.updated_at })
          .eq('accred_id', String(id));
      } catch (e) {
        console.warn('Supabase toggleAccreditationStatus fallback:', e.message);
      }
    }
    return item;
  },

  // ==========================================
  // TEAM MEMBERS
  // Tables: team, team_specializations, team_domains
  // ==========================================
  async getTeamMembers(includeInactive = true) {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('team').select('*').order('sort_order', { ascending: true });
        if (!includeInactive) query = query.eq('status', 'active');
        const { data, error } = await query;

        const { data: specData } = await supabase.from('team_specializations').select('*').order('sort_order', { ascending: true });
        const { data: domData } = await supabase.from('team_domains').select('*').order('sort_order', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map(m => {
            const memberId = m.member_id || String(m.id);
            const specs = (specData || []).filter(s => s.team_id === memberId).map(s => s.name);
            const doms = (domData || []).filter(d => d.team_id === memberId).map(d => ({
              icon: d.icon || '🛡️',
              title: d.title,
              desc: d.desc,
            }));

            return {
              id: memberId,
              member_id: memberId,
              name: m.name,
              role: m.role || '',
              company: m.company || '',
              experience: m.experience || '',
              badge: m.badge || '',
              photo: m.photo || '',
              bio: m.bio || '',
              specializations: specs,
              domains: doms,
              order: Number(m.sort_order) || 1,
              sort_order: Number(m.sort_order) || 1,
              status: m.status || 'active',
              active: m.status === 'active',
              created_at: m.created_at,
              updated_at: m.updated_at,
            };
          });
        }
      } catch (e) {
        console.warn('Supabase team fallback:', e.message);
      }
    }
    const list = readJson('team.json', []);
    return includeInactive ? list : list.filter(m => (m.status ? m.status === 'active' : m.active !== false));
  },

  async saveTeamMember(data, id = null) {
    const list = readJson('team.json', []);
    const memberId = id || data.id || `member-${Date.now()}`;
    const now = new Date().toISOString();
    const isActive = data.status ? data.status === 'active' : data.active !== false;

    const item = {
      ...data,
      id: memberId,
      member_id: memberId,
      status: isActive ? 'active' : 'inactive',
      active: isActive,
      order: Number(data.order || data.sort_order) || 1,
      updated_at: now,
    };

    const idx = list.findIndex(m => String(m.id) === String(memberId));
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    writeJson('team.json', list);

    if (isSupabaseConfigured) {
      try {
        const dbRow = {
          member_id: String(memberId),
          name: item.name || '',
          role: item.role || '',
          company: item.company || '',
          experience: item.experience || '',
          badge: item.badge || '',
          photo: item.photo || item.image || '',
          bio: item.bio || '',
          sort_order: item.order,
          status: item.status,
          updated_at: now,
        };
        const { error } = await supabase.from('team').upsert([dbRow], { onConflict: 'member_id' });
        if (error) {
          console.error('[Supabase Error] saveTeamMember:', error.message);
        } else {
          console.log(`✅ Team member [${item.name}] saved to Supabase.`);
        }

        if (Array.isArray(item.specializations)) {
          await supabase.from('team_specializations').delete().eq('team_id', String(memberId));
          if (item.specializations.length > 0) {
            await supabase.from('team_specializations').insert(
              item.specializations.map((name, i) => ({ team_id: String(memberId), name, sort_order: i + 1 }))
            );
          }
        }
        if (Array.isArray(item.domains)) {
          await supabase.from('team_domains').delete().eq('team_id', String(memberId));
          if (item.domains.length > 0) {
            await supabase.from('team_domains').insert(
              item.domains.map((d, i) => ({
                team_id: String(memberId),
                icon: d.icon || '🛡️',
                title: d.title || '',
                desc: d.desc || '',
                sort_order: i + 1,
              }))
            );
          }
        }
      } catch (e) {
        console.warn('Supabase saveTeamMember fallback:', e.message);
      }
    }
    return item;
  },

  async deleteTeamMember(id) {
    let list = readJson('team.json', []);
    list = list.filter(m => String(m.id) !== String(id));
    writeJson('team.json', list);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('team_specializations').delete().eq('team_id', String(id));
        await supabase.from('team_domains').delete().eq('team_id', String(id));
        await supabase.from('team').delete().eq('member_id', String(id));
      } catch (e) {
        console.warn('Supabase deleteTeamMember fallback:', e.message);
      }
    }
    return true;
  },

  // ==========================================
  // FAQS
  // Table: faqs (id, faq_id, track, question, answer, category, sort_order, status, created_at, updated_at)
  // Constraint: UNIQUE (faq_id)
  // ==========================================
  async getFaqs(track = 'all', includeInactive = true) {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('faqs').select('*').order('sort_order', { ascending: true });
        if (track !== 'all') query = query.or(`track.eq.${track},track.eq.general`);
        if (!includeInactive) query = query.eq('status', 'active');
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map(f => ({
            id: f.faq_id || String(f.id),
            faq_id: f.faq_id || String(f.id),
            track: f.track,
            question: f.question,
            answer: f.answer,
            category: f.category || 'General',
            order: Number(f.sort_order) || 1,
            sort_order: Number(f.sort_order) || 1,
            status: f.status || 'active',
            active: f.status === 'active',
            created_at: f.created_at,
            updated_at: f.updated_at,
          }));
        }
      } catch (e) {
        console.warn('Supabase faqs fallback:', e.message);
      }
    }
    let list = readJson('faqs.json', []);
    if (!includeInactive) {
      list = list.filter(f => (f.status ? f.status === 'active' : f.active !== false));
    }
    if (track !== 'all') {
      list = list.filter(f => f.track === track || f.track === 'all' || f.track === 'both' || f.track === 'general');
    }
    list.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    return list;
  },

  async saveFaq(data, id = null) {
    const list = readJson('faqs.json', []);
    const faqId = id || data.id || `faq-${Date.now()}`;
    const isInactive = data.status === 'inactive' || data.active === false;
    const status = isInactive ? 'inactive' : 'active';
    const now = new Date().toISOString();
    const rawTrack = data.track || 'general';
    const track = ['investigation', 'cyber', 'general'].includes(rawTrack) ? rawTrack : 'general';

    const item = {
      ...data,
      id: faqId,
      faq_id: faqId,
      track,
      status,
      active: !isInactive,
      order: Number(data.order || data.sort_order) || 1,
      category: data.category || 'General',
      updated_at: now,
    };

    const idx = list.findIndex(f => String(f.id) === String(faqId));
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item };
    } else {
      item.created_at = now;
      list.push(item);
    }
    writeJson('faqs.json', list);

    if (isSupabaseConfigured) {
      try {
        const dbRow = {
          faq_id: String(faqId),
          track: track,
          question: item.question || '',
          answer: item.answer || '',
          category: item.category,
          sort_order: item.order,
          status: status,
          updated_at: now,
        };
        const { error } = await supabase.from('faqs').upsert([dbRow], { onConflict: 'faq_id' });
        if (error) {
          console.error('[Supabase Error] saveFaq:', error.message);
        } else {
          console.log(`✅ FAQ [${faqId}] saved to Supabase.`);
        }
      } catch (e) {
        console.warn('Supabase saveFaq fallback:', e.message);
      }
    }
    return item;
  },

  async deleteFaq(id) {
    let list = readJson('faqs.json', []);
    list = list.filter(f => String(f.id) !== String(id));
    writeJson('faqs.json', list);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('faqs').delete().eq('faq_id', String(id));
      } catch (e) {
        console.warn('Supabase deleteFaq fallback:', e.message);
      }
    }
    return true;
  },

  async toggleFaqStatus(id) {
    const list = readJson('faqs.json', []);
    const item = list.find(f => String(f.id) === String(id));
    if (!item) return null;
    const isCurrentlyActive = (item.status === 'active' || item.active === true) && item.status !== 'inactive';
    item.status = isCurrentlyActive ? 'inactive' : 'active';
    item.active = !isCurrentlyActive;
    item.updated_at = new Date().toISOString();
    writeJson('faqs.json', list);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('faqs')
          .update({ status: item.status, updated_at: item.updated_at })
          .eq('faq_id', String(id));
      } catch (e) {
        console.warn('Supabase toggleFaqStatus fallback:', e.message);
      }
    }
    return item;
  },

  // ==========================================
  // LEGAL POLICIES
  // Table: legal_policies (id, policy_key, title, badge, last_updated, lead_summary, content, created_at, updated_at)
  // Constraint: UNIQUE (policy_key)
  // ==========================================
  async getLegalPolicies() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('legal_policies').select('*');
        if (!error && data && data.length > 0) {
          const map = {};
          data.forEach(p => {
            map[p.policy_key] = {
              ...p,
              key: p.policy_key,
              summary: p.lead_summary,
            };
          });
          return map;
        }
      } catch (e) {
        console.warn('Supabase legal_policies fallback:', e.message);
      }
    }
    return readJson('legal_policies.json', {});
  },

  async getLegalPolicy(key = 'privacy') {
    const all = await this.getLegalPolicies();
    return all[key] || null;
  },

  async saveLegalPolicy(key, data) {
    const all = await this.getLegalPolicies();
    const now = new Date().toISOString();
    const item = { ...data, key, policy_key: key, updated_at: now };
    all[key] = item;
    writeJson('legal_policies.json', all);

    if (isSupabaseConfigured) {
      try {
        const dbRow = {
          policy_key: key,
          title: item.title || '',
          badge: item.badge || '',
          last_updated: item.last_updated || new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
          lead_summary: item.lead_summary || item.summary || '',
          content: item.content || null,
          updated_at: now,
        };
        const { error } = await supabase.from('legal_policies').upsert([dbRow], { onConflict: 'policy_key' });
        if (error) {
          console.error('[Supabase Error] saveLegalPolicy:', error.message);
        } else {
          console.log(`✅ Legal Policy [${key}] saved to Supabase.`);
        }
      } catch (e) {
        console.warn('Supabase saveLegalPolicy fallback:', e.message);
      }
    }
    return item;
  },

  // ==========================================
  // ADMINS & PROFILE
  // Table: admins (id, username, name, email, password_hash, role, two_fa_secret, two_fa_enabled, created_at, updated_at)
  // Constraint: UNIQUE (username), UNIQUE (email)
  // ==========================================
  async getAdmins() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('admins').select('*');
        if (!error && data && data.length > 0) {
          const map = {};
          data.forEach(a => {
            map[a.username] = {
              ...a,
              two_fa_enabled: a.two_fa_enabled === 1 || a.two_fa_enabled === true,
            };
          });
          return map;
        }
      } catch (e) {
        console.warn('Supabase admins fallback:', e.message);
      }
    }
    return readJson('admins.json', {});
  },

  async getAdmin(username) {
    if (!username) return null;
    const all = await this.getAdmins();
    if (all[username]) return all[username];
    const norm = String(username).toLowerCase().trim();
    const key = Object.keys(all).find(k => k.toLowerCase().trim() === norm);
    return key ? all[key] : null;
  },

  async saveAdmin(adminData) {
    const all = await this.getAdmins();
    const username = adminData.username;
    const now = new Date().toISOString();
    all[username] = { ...adminData, updated_at: now };
    writeJson('admins.json', all);

    if (isSupabaseConfigured) {
      try {
        const dbRow = {
          username: adminData.username,
          name: adminData.name || '',
          email: adminData.email || adminData.username,
          password_hash: adminData.password_hash,
          role: adminData.role || 'admin',
          two_fa_secret: adminData.two_fa_secret || null,
          two_fa_enabled: adminData.two_fa_enabled ? 1 : 0,
          updated_at: now,
        };
        const { error } = await supabase.from('admins').upsert([dbRow], { onConflict: 'username' });
        if (error) {
          console.error('[Supabase Error] saveAdmin:', error.message);
        } else {
          console.log(`✅ Admin [${username}] saved to Supabase.`);
        }
      } catch (e) {
        console.warn('Supabase saveAdmin fallback:', e.message);
      }
    }
    return all[username];
  },

  async updateAdminProfile(currentUsername, newUsername, email, passwordHash = null, name = null) {
    const all = await this.getAdmins();
    const current = all[currentUsername];
    if (!current) return null;

    if (newUsername !== currentUsername) {
      delete all[currentUsername];
      if (isSupabaseConfigured) {
        try {
          await supabase.from('admins').delete().eq('username', currentUsername);
        } catch (e) { }
      }
    }

    const now = new Date().toISOString();
    const updated = {
      ...current,
      username: newUsername,
      email,
      name: name || current.name,
      password_hash: passwordHash || current.password_hash,
      updated_at: now,
    };
    all[newUsername] = updated;
    writeJson('admins.json', all);

    if (isSupabaseConfigured) {
      try {
        const dbRow = {
          username: newUsername,
          name: updated.name,
          email: updated.email,
          password_hash: updated.password_hash,
          role: updated.role || 'admin',
          two_fa_secret: updated.two_fa_secret || null,
          two_fa_enabled: updated.two_fa_enabled ? 1 : 0,
          updated_at: now,
        };
        const { error } = await supabase.from('admins').upsert([dbRow], { onConflict: 'username' });
        if (error) {
          console.error('[Supabase Error] updateAdminProfile:', error.message);
        } else {
          console.log(`✅ Admin profile [${newUsername}] updated in Supabase.`);
        }
      } catch (e) {
        console.warn('Supabase updateAdminProfile fallback:', e.message);
      }
    }
    return updated;
  },

  // ==========================================
  // 2FA STORAGE
  // Persisted in storage/security/admin_2fa.json and synced to Supabase admins table
  // ==========================================
  async get2FAData(username) {
    if (!username) return null;
    const norm = String(username).toLowerCase().trim();
    const store = readSecurityJson('admin_2fa.json', { version: 1, records: [] });
    const records = Array.isArray(store.records) ? store.records : [];
    let localRecord = records.find(r => r.username && r.username.toLowerCase().trim() === norm) || null;

    if (!localRecord || !localRecord.secret_encrypted) {
      try {
        const allAdmins = readJson('admins.json', {});
        const adminKey = Object.keys(allAdmins).find(k => k.toLowerCase().trim() === norm);
        if (adminKey && allAdmins[adminKey] && allAdmins[adminKey].two_fa_secret) {
          localRecord = {
            username: norm,
            secret_encrypted: allAdmins[adminKey].two_fa_secret,
            enabled: Boolean(allAdmins[adminKey].two_fa_enabled === 1 || allAdmins[adminKey].two_fa_enabled === true || allAdmins[adminKey].two_fa_enabled === '1'),
            backup_codes: localRecord?.backup_codes || [],
          };
        }
      } catch (e) {}
    }

    if (isSupabaseConfigured && (!localRecord || !localRecord.secret_encrypted)) {
      try {
        const { data, error } = await supabase
          .from('admins')
          .select('two_fa_secret, two_fa_enabled')
          .ilike('username', norm)
          .single();

        if (!error && data && data.two_fa_secret) {
          localRecord = {
            username: norm,
            secret_encrypted: data.two_fa_secret,
            enabled: Boolean(data.two_fa_enabled === 1 || data.two_fa_enabled === true || data.two_fa_enabled === '1'),
            backup_codes: localRecord?.backup_codes || [],
          };
        }
      } catch (e) { }
    }
    return localRecord;
  },

  async save2FAData(username, record) {
    const norm = String(username || '').toLowerCase().trim();
    const store = readSecurityJson('admin_2fa.json', { version: 1, records: [] });
    let records = Array.isArray(store.records) ? store.records : [];
    const idx = records.findIndex(r => r.username && r.username.toLowerCase().trim() === norm);
    const now = new Date().toISOString();
    const isEnabled = Boolean(record.enabled === true || record.enabled === 1 || record.enabled === '1');
    const item = { ...record, username: norm, enabled: isEnabled, updated_at: now };
    if (idx >= 0) {
      records[idx] = item;
    } else {
      records.push(item);
    }
    store.records = records;
    writeSecurityJson('admin_2fa.json', store);

    // Sync to admins.json
    try {
      const allAdmins = readJson('admins.json', {});
      const adminKey = Object.keys(allAdmins).find(k => k.toLowerCase().trim() === norm);
      if (adminKey && allAdmins[adminKey]) {
        allAdmins[adminKey].two_fa_enabled = isEnabled ? 1 : 0;
        allAdmins[adminKey].two_fa_secret = record.secret_encrypted || null;
        allAdmins[adminKey].updated_at = now;
        writeJson('admins.json', allAdmins);
      }
    } catch (e) {}

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('admins')
          .update({
            two_fa_secret: record.secret_encrypted || null,
            two_fa_enabled: isEnabled ? 1 : 0,
            updated_at: now,
          })
          .ilike('username', norm);
        console.log(`✅ Admin 2FA status synced to Supabase admins table for [${norm}].`);
      } catch (e) {
        console.warn('Supabase save2FAData fallback:', e.message);
      }
    }
    return item;
  },

  async delete2FAData(username) {
    const norm = String(username || '').toLowerCase().trim();
    const store = readSecurityJson('admin_2fa.json', { version: 1, records: [] });
    let records = Array.isArray(store.records) ? store.records : [];
    store.records = records.filter(r => r.username && r.username.toLowerCase().trim() !== norm);
    writeSecurityJson('admin_2fa.json', store);

    // Sync to admins.json
    try {
      const allAdmins = readJson('admins.json', {});
      const adminKey = Object.keys(allAdmins).find(k => k.toLowerCase().trim() === norm);
      if (adminKey && allAdmins[adminKey]) {
        allAdmins[adminKey].two_fa_enabled = 0;
        allAdmins[adminKey].two_fa_secret = null;
        allAdmins[adminKey].updated_at = new Date().toISOString();
        writeJson('admins.json', allAdmins);
      }
    } catch (e) {}

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('admins')
          .update({
            two_fa_secret: null,
            two_fa_enabled: 0,
            updated_at: new Date().toISOString(),
          })
          .ilike('username', norm);
      } catch (e) { }
    }
    return true;
  },

  // ==========================================
  // AUDIT LOGS
  // Written to storage/security/security_audit.log
  // ==========================================
  async addAuditLog(adminId, action, details = {}, ip = '', userAgent = '') {
    const logItem = {
      admin_id: adminId,
      action,
      details,
      ip_address: ip,
      user_agent: userAgent,
      created_at: new Date().toISOString(),
    };
    try {
      const line = `[${logItem.created_at}] [${ip}] [${adminId}] ${action}: ${JSON.stringify(details)}\n`;
      fs.appendFileSync(path.join(SECURITY_DIR, 'security_audit.log'), line);
    } catch (e) { }
    return logItem;
  },

  // ==========================================
  // CONTACT LEADS (Inquiries submitted from website)
  // Table: contact_leads (id, name, email, phone, service, message, ip_address, source, sheet_synced, created_at)
  // ==========================================
  async getLeads() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('contact_leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map(l => ({
            id: String(l.id),
            db_id: l.id,
            name: l.name,
            email: l.email,
            phone: l.phone,
            service: l.service,
            message: l.message,
            ip: l.ip_address,
            source: l.source || 'website',
            sheet_synced: Boolean(l.sheet_synced),
            created_at: l.created_at,
          }));
        }
      } catch (e) {
        console.warn('Supabase contact_leads fallback:', e.message);
      }
    }
    return readJson('leads.json', []);
  },

  async saveLead(leadData) {
    const list = readJson('leads.json', []);
    const now = new Date().toISOString();
    const lead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...leadData,
      created_at: now,
    };
    list.unshift(lead);
    writeJson('leads.json', list);

    if (isSupabaseConfigured) {
      try {
        const dbRow = {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          service: lead.service,
          message: lead.message,
          ip_address: lead.ip || '',
          source: lead.source || 'website',
          sheet_synced: lead.sheet_synced ? 1 : 0,
          created_at: now,
        };
        const { data, error } = await supabase.from('contact_leads').insert([dbRow]).select();
        if (error) {
          console.error('[Supabase Error] contact_leads insert failed:', error.message);
        } else if (data && data[0]) {
          lead.db_id = data[0].id;
          console.log(`✅ Confidential Contact Lead [${lead.name}] persisted to Supabase database (ID: ${data[0].id}).`);
        }
      } catch (e) {
        console.warn('Supabase saveLead fallback:', e.message);
      }
    }
    return lead;
  },

  async updateLeadSheetSynced(leadId, synced = true) {
    const list = readJson('leads.json', []);
    const idx = list.findIndex(l => l.id === leadId || String(l.db_id) === String(leadId));
    if (idx >= 0) {
      list[idx].sheet_synced = Boolean(synced);
      writeJson('leads.json', list);
    }

    if (isSupabaseConfigured) {
      try {
        if (typeof leadId === 'number' || !isNaN(Number(leadId))) {
          await supabase.from('contact_leads').update({ sheet_synced: synced ? 1 : 0 }).eq('id', Number(leadId));
        } else if (idx >= 0 && list[idx].email) {
          await supabase.from('contact_leads').update({ sheet_synced: synced ? 1 : 0 }).eq('email', list[idx].email);
        }
      } catch (e) { }
    }
  },

  // ==========================================
  // FILE UPLOADS
  // Uploads to Supabase Storage bucket 'uploads' + local mirror
  // ==========================================
  async handleFileUpload(file, prefix = 'img') {
    if (!file) return null;
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];
    if (!allowed.includes(ext)) {
      throw new Error('Invalid file format. Allowed: JPG, PNG, WEBP, SVG, GIF');
    }

    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;

    // Upload to Supabase Storage if configured
    if (isSupabaseConfigured) {
      try {
        const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
        const { data, error } = await supabase.storage.from(bucket).upload(filename, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });
        if (!error && data) {
          const { data: pubUrl } = supabase.storage.from(bucket).getPublicUrl(filename);
          if (pubUrl && pubUrl.publicUrl) {
            console.log(`✅ File uploaded to Supabase Storage bucket [${bucket}]: ${filename}`);
            return pubUrl.publicUrl;
          }
        } else if (error) {
          console.warn('[Supabase Warning] storage upload:', error.message);
        }
      } catch (e) {
        console.warn('Supabase storage upload fallback:', e.message);
      }
    }

    // Local file fallback
    const destPath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(destPath, file.buffer);
    const frontDest = path.resolve(__dirname, '../../../frontend/public/data/uploads', filename);
    try {
      fs.writeFileSync(frontDest, file.buffer);
    } catch (e) { }

    return `data/uploads/${filename}`;
  },
};

export default storageService;
