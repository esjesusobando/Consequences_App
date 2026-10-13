import { describe, it, expect } from 'vitest';
import { translations } from './translations';

describe('translations', () => {
  describe('Spanish (es)', () => {
    it('has expected sidebar dashboard value', () => {
      expect(translations.es.sidebar.dashboard).toBe('PANEL_CONSECUENCIAS');
    });

    it('has all sidebar keys', () => {
      const keys = Object.keys(translations.es.sidebar);
      expect(keys).toContain('dashboard');
      expect(keys).toContain('mail');
      expect(keys).toContain('drive');
      expect(keys).toContain('tasks');
      expect(keys).toContain('settings');
      expect(keys).toContain('design_system');
      expect(keys).toContain('focus');
      expect(keys).toContain('sync');
      expect(keys).toContain('syncing');
      expect(keys).toContain('disconnect');
      expect(keys).toContain('operator');
      expect(keys).toContain('guest');
      expect(keys).toContain('sandbox');
      expect(keys).toContain('live');
      expect(keys).toContain('connect_pending');
      expect(keys).toContain('acoplar');
      expect(keys).toContain('desplegar');
    });

    it('has all header keys', () => {
      const keys = Object.keys(translations.es.header);
      expect(keys).toContain('feed');
      expect(keys).toContain('countdown');
      expect(keys).toContain('standby');
      expect(keys).toContain('search_placeholder');
      expect(keys).toContain('live_connection');
      expect(keys).toContain('offline');
    });

    it('has all focus keys', () => {
      const keys = Object.keys(translations.es.focus);
      expect(keys).toContain('protocol_active');
      expect(keys).toContain('title');
      expect(keys).toContain('desc');
      expect(keys).toContain('meeting_dock');
      expect(keys).toContain('no_meetings');
      expect(keys).toContain('start_in');
      expect(keys).toContain('day');
      expect(keys).toContain('time');
      expect(keys).toContain('location');
      expect(keys).toContain('description');
      expect(keys).toContain('attendees');
      expect(keys).toContain('note');
      expect(keys).toContain('no_description');
      expect(keys).toContain('no_location');
      expect(keys).toContain('no_attendees');
      expect(keys).toContain('no_note');
      expect(keys).toContain('preset_title');
      expect(keys).toContain('deep_focus');
      expect(keys).toContain('light_focus');
      expect(keys).toContain('short_rest');
      expect(keys).toContain('custom_interval');
      expect(keys).toContain('enter_duration');
      expect(keys).toContain('launch_btn');
      expect(keys).toContain('active_status');
      expect(keys).toContain('paused_status');
      expect(keys).toContain('dictation_title');
      expect(keys).toContain('dictation_unsupported');
      expect(keys).toContain('recording_status');
      expect(keys).toContain('recording_inactive');
      expect(keys).toContain('listening');
      expect(keys).toContain('start_recording');
      expect(keys).toContain('stop_recording');
      expect(keys).toContain('note_title_placeholder');
      expect(keys).toContain('note_content_placeholder');
      expect(keys).toContain('save_note');
      expect(keys).toContain('database_title');
      expect(keys).toContain('no_notes');
      expect(keys).toContain('export_to');
      expect(keys).toContain('delete_note');
      expect(keys).toContain('refine_ai');
      expect(keys).toContain('refining');
      expect(keys).toContain('keys_title');
      expect(keys).toContain('keys_desc');
      expect(keys).toContain('notion_token');
      expect(keys).toContain('notion_db');
      expect(keys).toContain('todoist_token');
      expect(keys).toContain('save_keys');
    });

    it('has all dashboard keys', () => {
      const keys = Object.keys(translations.es.dashboard);
      expect(keys).toContain('next_meeting_title');
      expect(keys).toContain('standby');
      expect(keys).toContain('active_node');
      expect(keys).toContain('all_day');
      expect(keys).toContain('no_meetings');
      expect(keys).toContain('view_details');
      expect(keys).toContain('unread_mail');
      expect(keys).toContain('pending_tasks');
      expect(keys).toContain('stored_documents');
      expect(keys).toContain('upcoming_meetings');
      expect(keys).toContain('next');
      expect(keys).toContain('all_day_event');
    });

    it('has all mail keys', () => {
      const keys = Object.keys(translations.es.mail);
      expect(keys).toContain('transmissions');
      expect(keys).toContain('show_all');
      expect(keys).toContain('filter_unread');
      expect(keys).toContain('empty');
      expect(keys).toContain('unread');
      expect(keys).toContain('from_node');
      expect(keys).toContain('clear_alert');
      expect(keys).toContain('transmission_subject');
      expect(keys).toContain('tether');
      expect(keys).toContain('no_active');
      expect(keys).toContain('desc_empty');
    });

    it('has all tasks keys', () => {
      const keys = Object.keys(translations.es.tasks);
      expect(keys).toContain('pending');
      expect(keys).toContain('completed');
      expect(keys).toContain('registry');
      expect(keys).toContain('placeholder');
      expect(keys).toContain('dispatch');
      expect(keys).toContain('all_clear');
    });

    it('has all drive keys', () => {
      const keys = Object.keys(translations.es.drive);
      expect(keys).toContain('new_node');
      expect(keys).toContain('upload');
      expect(keys).toContain('view');
      expect(keys).toContain('empty');
      expect(keys).toContain('live');
      expect(keys).toContain('size');
      expect(keys).toContain('type');
      expect(keys).toContain('id');
      expect(keys).toContain('link');
      expect(keys).toContain('close');
      expect(keys).toContain('create_node_title');
      expect(keys).toContain('create_node_name');
      expect(keys).toContain('create_node_type');
      expect(keys).toContain('create_node_size');
      expect(keys).toContain('create_node_submit');
      expect(keys).toContain('upload_title');
      expect(keys).toContain('upload_desc');
      expect(keys).toContain('upload_placeholder');
    });

    it('has all settings keys', () => {
      const keys = Object.keys(translations.es.settings);
      expect(keys).toContain('registry');
      expect(keys).toContain('desc');
      expect(keys).toContain('live_account');
      expect(keys).toContain('sandbox_account');
      expect(keys).toContain('forget');
      expect(keys).toContain('active_status');
      expect(keys).toContain('select');
      expect(keys).toContain('env');
      expect(keys).toContain('env_desc');
      expect(keys).toContain('google_client_id');
      expect(keys).toContain('google_client_secret');
      expect(keys).toContain('setup_status');
      expect(keys).toContain('set');
      expect(keys).toContain('missing');
      expect(keys).toContain('redirect_uri');
      expect(keys).toContain('redirect_desc');
      expect(keys).toContain('copy');
      expect(keys).toContain('copied');
      expect(keys).toContain('consequences_desc');
      expect(keys).toContain('by_obanlover');
      expect(keys).toContain('define_legacy');
    });

    it('has all login keys', () => {
      const keys = Object.keys(translations.es.login);
      expect(keys).toContain('terminal');
      expect(keys).toContain('subtitle');
      expect(keys).toContain('desc');
      expect(keys).toContain('connect');
      expect(keys).toContain('bypass');
      expect(keys).toContain('select');
    });
  });

  describe('English (en)', () => {
    it('has expected sidebar dashboard value', () => {
      expect(translations.en.sidebar.dashboard).toBe('CONSEQUENCES_DASH');
    });

    it('has all required top-level locale keys', () => {
      const esKeys = Object.keys(translations.es);
      const enKeys = Object.keys(translations.en);

      expect(esKeys).toEqual(enKeys);
    });

    it('has all sidebar keys matching spanish', () => {
      expect(Object.keys(translations.en.sidebar)).toEqual(Object.keys(translations.es.sidebar));
    });

    it('has all header keys matching spanish', () => {
      expect(Object.keys(translations.en.header)).toEqual(Object.keys(translations.es.header));
    });

    it('has all focus keys matching spanish', () => {
      expect(Object.keys(translations.en.focus)).toEqual(Object.keys(translations.es.focus));
    });

    it('has all dashboard keys matching spanish', () => {
      expect(Object.keys(translations.en.dashboard)).toEqual(Object.keys(translations.es.dashboard));
    });

    it('has all mail keys matching spanish', () => {
      expect(Object.keys(translations.en.mail)).toEqual(Object.keys(translations.es.mail));
    });

    it('has all tasks keys matching spanish', () => {
      expect(Object.keys(translations.en.tasks)).toEqual(Object.keys(translations.es.tasks));
    });

    it('has all drive keys matching spanish', () => {
      expect(Object.keys(translations.en.drive)).toEqual(Object.keys(translations.es.drive));
    });

    it('has all settings keys matching spanish', () => {
      expect(Object.keys(translations.en.settings)).toEqual(Object.keys(translations.es.settings));
    });

    it('has all login keys matching spanish', () => {
      expect(Object.keys(translations.en.login)).toEqual(Object.keys(translations.es.login));
    });
  });

  describe('structural integrity', () => {
    it('both locales have the same top-level sections', () => {
      const esSections = Object.keys(translations.es);
      const enSections = Object.keys(translations.en);
      expect(esSections.sort()).toEqual(enSections.sort());
    });

    it('every value in both locales is a string', () => {
      function isAllStrings(obj: Record<string, unknown>): boolean {
        return Object.values(obj).every((v) => {
          if (typeof v === 'string') return true;
          if (typeof v === 'object' && v !== null) return isAllStrings(v as Record<string, unknown>);
          return false;
        });
      }
      expect(isAllStrings(translations.es)).toBe(true);
      expect(isAllStrings(translations.en)).toBe(true);
    });
  });
});
