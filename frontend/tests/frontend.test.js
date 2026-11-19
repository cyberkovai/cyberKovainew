import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as api from '../src/api/client.js';
import { getAssetUrl } from '../src/utils/assets.js';
import { isSectionVisible } from '../src/utils/sections.js';

describe('Frontend API Client & Helper Logic Test Suite', () => {
  it('should export all required public and admin API methods', () => {
    const requiredPublicMethods = [
      'getSettings',
      'getSections',
      'getCategories',
      'getCyberServices',
      'getCyberService',
      'getFullService',
      'getRecaptchaConfig',
      'getPractices',
      'getInvestigationServices',
      'getInvestigationService',
      'getThreats',
      'getTestimonials',
      'getClients',
      'getAccreditations',
      'getTeam',
      'getFaqs',
      'getLegalPolicies',
      'getLegalPolicy',
      'submitContact',
    ];

    for (const m of requiredPublicMethods) {
      assert.strictEqual(typeof api[m], 'function', `API method ${m} must be exported`);
    }

    const requiredAdminMethods = [
      'adminLogin',
      'verify2FA',
      'getCurrentUser',
      'setup2FA',
      'confirm2FA',
      'disable2FA',
      'cancel2FA',
      'updateProfile',
      'adminLogout',
      'getDashboardStats',
      'updateSettings',
      'updateSections',
      'adminGetCyberServices',
      'adminSaveCyberService',
      'adminDeleteCyberService',
      'adminGetPractices',
      'adminSavePractice',
      'adminDeletePractice',
      'adminTogglePractice',
      'adminGetInvestigationServices',
      'adminSaveInvestigationService',
      'adminDeleteInvestigationService',
      'adminToggleInvestigationService',
      'adminGetThreats',
      'adminSaveThreat',
      'adminDeleteThreat',
      'adminToggleThreat',
      'adminGetTestimonials',
      'adminSaveTestimonial',
      'adminDeleteTestimonial',
      'adminToggleTestimonial',
      'adminGetClients',
      'adminSaveClient',
      'adminDeleteClient',
      'adminToggleClient',
      'adminGetAccreditations',
      'adminSaveAccreditation',
      'adminDeleteAccreditation',
      'adminToggleAccreditation',
      'adminGetTeam',
      'adminSaveTeam',
      'adminDeleteTeam',
      'adminGetFaqs',
      'adminSaveFaq',
      'adminDeleteFaq',
      'adminToggleFaq',
      'adminGetLegal',
      'adminSaveLegal',
      'adminUploadFile',
    ];

    for (const m of requiredAdminMethods) {
      assert.strictEqual(typeof api[m], 'function', `Admin API method ${m} must be exported`);
    }
  });

  it('should verify slugify helper behavior', () => {
    const slugify = (text) =>
      (text || '')
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');

    assert.strictEqual(slugify('Cloud Security & VAPT 2026!'), 'cloud-security-vapt-2026');
    assert.strictEqual(slugify('  Cybercrime Victim Recovery  '), 'cybercrime-victim-recovery');
    assert.strictEqual(slugify(''), '');
  });

  it('should verify feature and deliverable text parser behavior', () => {
    const parseKeyFeatures = (text) => {
      if (!text) return [];
      return text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const idx = line.indexOf(':');
          if (idx !== -1) {
            return {
              title: line.slice(0, idx).trim(),
              desc: line.slice(idx + 1).trim(),
            };
          }
          return { title: line, desc: '' };
        });
    };

    const input = 'Feature One: Detailed description of feature\nFeature Two: Another description';
    const parsed = parseKeyFeatures(input);
    assert.strictEqual(parsed.length, 2);
    assert.strictEqual(parsed[0].title, 'Feature One');
    assert.strictEqual(parsed[0].desc, 'Detailed description of feature');
  });

  it('should verify track URL switching logic', () => {
    const resolveHomeUrl = (activeTrack) =>
      activeTrack === 'cyber' ? '/digital-forensics?section=cyber' : '/cyber-intelligence?section=forensics';

    assert.strictEqual(resolveHomeUrl('cyber'), '/digital-forensics?section=cyber');
    assert.strictEqual(resolveHomeUrl('forensics'), '/cyber-intelligence?section=forensics');
  });

  it('should verify getAssetUrl correctly handles local assets and Supabase Storage URLs', () => {
    // 1. External Supabase Storage URLs must remain completely untouched
    const supabasePublicUrl = 'https://aqplfghbcnadpdnvdiwe.supabase.co/storage/v1/object/public/uploads/test_photo.png';
    assert.strictEqual(getAssetUrl(supabasePublicUrl), supabasePublicUrl);

    const supabaseSignedUrl = 'https://aqplfghbcnadpdnvdiwe.supabase.co/storage/v1/object/sign/uploads/secure.pdf?token=abc';
    assert.strictEqual(getAssetUrl(supabaseSignedUrl), supabaseSignedUrl);

    // 2. Data and Blob URIs must remain untouched
    const dataUri = 'data:image/svg+xml,%3Csvg%3E%3C/svg%3E';
    assert.strictEqual(getAssetUrl(dataUri), dataUri);

    // 3. Local asset paths
    assert.strictEqual(getAssetUrl('assets/images/logo.png'), '/assets/images/logo.png');
    assert.strictEqual(getAssetUrl('/assets/images/logo.png'), '/assets/images/logo.png');
    assert.strictEqual(getAssetUrl('data/uploads/image.jpg'), '/data/uploads/image.jpg');

    // 4. Null or empty paths
    assert.strictEqual(getAssetUrl(''), '');
    assert.strictEqual(getAssetUrl(null), '');
  });

  it('should correctly evaluate section visibility for boolean, numeric, and string representations', () => {
    // Hidden states: false, 0, '0', 'false'
    assert.strictEqual(isSectionVisible({ cyber_hero: false }, 'cyber_hero'), false);
    assert.strictEqual(isSectionVisible({ cyber_hero: 0 }, 'cyber_hero'), false);
    assert.strictEqual(isSectionVisible({ cyber_hero: '0' }, 'cyber_hero'), false);
    assert.strictEqual(isSectionVisible({ cyber_hero: 'false' }, 'cyber_hero'), false);

    // Visible states: true, 1, '1', 'true'
    assert.strictEqual(isSectionVisible({ cyber_hero: true }, 'cyber_hero'), true);
    assert.strictEqual(isSectionVisible({ cyber_hero: 1 }, 'cyber_hero'), true);
    assert.strictEqual(isSectionVisible({ cyber_hero: '1' }, 'cyber_hero'), true);
    assert.strictEqual(isSectionVisible({ cyber_hero: 'true' }, 'cyber_hero'), true);

    // Default states when missing or undefined
    assert.strictEqual(isSectionVisible({}, 'cyber_hero'), true);
    assert.strictEqual(isSectionVisible({ cyber_hero: undefined }, 'cyber_hero'), true);
    assert.strictEqual(isSectionVisible(null, 'cyber_hero'), true);
    assert.strictEqual(isSectionVisible(undefined, 'cyber_hero'), true);
  });
});
