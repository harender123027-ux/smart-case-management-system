import api from '../services/api';
import {
  getUnsyncedComplaints, markComplaintSynced,
  getUnsyncedCases, markCaseSynced,
} from './localDb';

export const syncAll = async (token, onProgress) => {
  const results = { complaints: 0, cases: 0, errors: [] };

  try {
    // Sync complaints
    const unsyncedComplaints = getUnsyncedComplaints();
    if (unsyncedComplaints.length > 0) {
      onProgress?.(`Syncing ${unsyncedComplaints.length} complaint(s)...`);
      const res = await api.post('/complaints/sync', { complaints: unsyncedComplaints });
      for (const r of (res.data.results || [])) {
        markComplaintSynced(r.offline_id, r.server_id);
        results.complaints++;
      }
    }

    // Sync cases
    const unsyncedCases = getUnsyncedCases();
    if (unsyncedCases.length > 0) {
      onProgress?.(`Syncing ${unsyncedCases.length} case(s)...`);
      const res = await api.post('/cases/sync', { cases: unsyncedCases });
      for (const r of (res.data.results || [])) {
        markCaseSynced(r.offline_id, r.server_id);
        results.cases++;
      }
    }

    onProgress?.(`✅ Sync complete`);
  } catch (err) {
    results.errors.push(err.message);
    console.error('Sync error:', err.message);
  }

  return results;
};
