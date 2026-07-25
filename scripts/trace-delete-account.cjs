/**
 * Delete Account — debug trace (Node.js, no browser needed)
 *
 * Replicates exactly what the browser does:
 *   1. supabase.auth.getSession()          → does auth.uid() exist?
 *   2. SELECT clients WHERE user_id=uid    → does the client row exist?
 *   3. UPDATE clients SET …               → what does Supabase return?
 *   4. supabase.auth.signOut()             → what happens after?
 *
 * Every call is made with the SAME JWT the browser would have,
 * so RLS behaves identically.
 */

'use strict';

const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const SUPABASE_URL     = process.env.VITE_SUPABASE_URL;
const ANON_KEY         = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error('ERROR: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY required.');
  process.exit(1);
}

// ── Admin helper (service role, bypasses RLS — only used for user lifecycle) ──
async function adminFetch(path, method = 'GET', body) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      'apikey':        SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type':  'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}

// ── Pretty logger — mirrors the debug panel's log format ─────────────────────
let seq = 0;
function dbg(category, label, payload) {
  const t   = new Date().toISOString().slice(11, 23);
  const num = String(++seq).padStart(2, '0');
  const p   = payload ? '  ' + JSON.stringify(payload) : '';
  console.log(`[${num}] ${t}  [${category}]  ${label}${p}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  const TEST_EMAIL    = `dbg-trace-${Date.now()}@test-shelan.dev`;
  const TEST_PASSWORD = 'TraceTest#2026!';

  console.log('══════════════════════════════════════════════════════════════');
  console.log('  DELETE ACCOUNT — debug trace (mirrors browser debug panel)');
  console.log('══════════════════════════════════════════════════════════════\n');

  // ── STEP 0: Create throwaway client user (admin API, no RLS) ─────────────
  console.log('── STEP 0: Create test user ─────────────────────────────────');
  const createRes = await adminFetch('/auth/v1/admin/users', 'POST', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (!createRes.ok) {
    console.error('Cannot create test user:', JSON.stringify(createRes.data));
    process.exit(1);
  }
  const testUserId = createRes.data.id;
  dbg('SETUP', 'Test user created', { email: TEST_EMAIL, uid: testUserId });

  // ── Build a Supabase CLIENT as the test user (same anon key the browser uses)
  const supabase = createClient(SUPABASE_URL, ANON_KEY, {
    realtime: { transport: ws },
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  });

  // ── STEP 1: Sign in (identical to AuthModal signInWithPassword call) ──────
  console.log('\n── STEP 1: Sign in ──────────────────────────────────────────');
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD });

  if (signInError) {
    dbg('AUTH', 'signInWithPassword ERROR', { message: signInError.message, status: signInError.status });
    process.exit(1);
  }
  dbg('AUTH', 'signInWithPassword OK', {
    uid:   signInData.user.id,
    email: signInData.user.email,
    role:  signInData.user.role,
    'access_token.length': signInData.session.access_token.length,
  });

  // ── STEP 2: getSession() — what AuthGuard / useClientProfile see ─────────
  console.log('\n── STEP 2: getSession() — AuthGuard check ───────────────────');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    dbg('AUTH', 'getSession FAILED — no session', { error: sessionError?.message });
    process.exit(1);
  }
  dbg('AUTH', 'getSession OK', {
    'auth.uid()': sessionData.session.user.id,
    'auth.email()': sessionData.session.user.email,
  });
  const authUid = sessionData.session.user.id;

  // ── STEP 3: SELECT clients WHERE user_id = auth.uid()  (useClientProfile) ─
  console.log('\n── STEP 3: SELECT clients (useClientProfile hook) ───────────');
  const { data: profileData, error: profileError, count: profileCount } =
    await supabase
      .from('clients')
      .select('*', { count: 'exact' })
      .eq('user_id', authUid)
      .maybeSingle();

  if (profileError) {
    dbg('DB', 'select(clients) ERROR', {
      message: profileError.message,
      code:    profileError.code,
      details: profileError.details,
      hint:    profileError.hint,
    });
  } else if (!profileData) {
    dbg('DB', 'select(clients) — NO ROW FOUND (profile is null)', {
      'user_id queried': authUid,
      note: 'useClientProfile will return null; delete button will be unreachable',
    });
  } else {
    dbg('DB', 'select(clients) OK', {
      'client.id':      profileData.id,
      'client.user_id': profileData.user_id,
      'client.status':  profileData.status,
      'client.email':   profileData.email,
      rows: profileCount,
    });
  }

  // If no client row exists, simulate upsertClientFromAuth (same RPC the browser calls
  // from AuthModal / useClientProfile after signInWithPassword succeeds).
  let clientId;
  if (!profileData) {
    console.log('\n   → No client row yet. Calling upsert_client_from_auth RPC (same as browser) …');
    const today = new Date().toISOString().slice(0, 10);
    const testName = TEST_EMAIL.split('@')[0];

    const { error: rpcError } = await supabase.rpc('upsert_client_from_auth', {
      p_name:       testName,
      p_initials:   testName.slice(0, 2).toUpperCase(),
      p_color:      'bg-gradient-to-br from-primary-pink to-soft-pink',
      p_status:     'Waiting',
      p_risk_level: 'Low',
      p_join_date:  today,
    });

    if (rpcError) {
      dbg('DB', 'rpc(upsert_client_from_auth) ERROR', {
        message: rpcError.message,
        code:    rpcError.code,
        details: rpcError.details,
        hint:    rpcError.hint,
      });
      process.exit(1);
    }
    dbg('DB', 'rpc(upsert_client_from_auth) OK — client row created/linked');

    // Re-fetch profile after RPC
    const { data: reFetch, error: reFetchErr } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', authUid)
      .maybeSingle();
    if (reFetchErr || !reFetch) {
      dbg('DB', 'select(clients) re-fetch FAILED', { error: reFetchErr?.message });
      process.exit(1);
    }
    dbg('DB', 'select(clients) re-fetch OK', {
      'client.id':      reFetch.id,
      'client.user_id': reFetch.user_id,
      'client.status':  reFetch.status,
      'client.email':   reFetch.email,
    });
    clientId = reFetch.id;
  } else {
    clientId = profileData.id;
  }

  // ── STEP 4: THE DELETE OPERATION — deactivateOwnAccount() ────────────────
  console.log('\n── STEP 4: deactivateOwnAccount() — THE OPERATION UNDER TEST ─');
  dbg('ACTION', 'Calling UPDATE clients SET status=Inactive, user_id=NULL', {
    'WHERE id':       clientId,
    'auth.uid()':     authUid,
    note: 'RLS USING: user_id = auth.uid()  |  WITH CHECK: user_id=uid OR user_id IS NULL',
  });

  // NOTE: The real deactivateOwnAccount() does NOT call .select().
  // Adding .select() forces PostgREST to re-apply the SELECT RLS policy to the
  // returned row — after user_id becomes NULL the client can no longer see their
  // own row, which triggers a spurious 403.  Match the real code exactly.
  const { data: updateData, error: updateError, count: updateCount, status: updateStatus, statusText } =
    await supabase
      .from('clients')
      .update({ status: 'Inactive', user_id: null })
      .eq('id', clientId);

  console.log('\n  ┌─ RAW SUPABASE RESPONSE ─────────────────────────────────┐');
  console.log('  │ HTTP status:  ', updateStatus, statusText || '');
  console.log('  │ error:        ', updateError  ? JSON.stringify(updateError)  : 'null');
  console.log('  │ data:         ', updateData   ? JSON.stringify(updateData)   : 'null');
  console.log('  │ count:        ', updateCount  ?? 'null (Prefer: count header not requested)');
  console.log('  └────────────────────────────────────────────────────────────┘\n');

  if (updateError) {
    dbg('DB', 'update(clients) ERROR', {
      message: updateError.message,
      code:    updateError.code,
      details: updateError.details,
      hint:    updateError.hint,
      status:  updateStatus,
    });
    dbg('RESULT', '→ deactivateOwnAccount() would return FALSE (error branch)', {
      'toast shown': 'Failed to deactivate account. Please contact support.',
    });
  } else {
    const rowsAffected = Array.isArray(updateData) ? updateData.length : (updateData ? 1 : 0);
    dbg('DB', 'update(clients) — no error', {
      'rows returned by .select()': rowsAffected,
      data: updateData,
    });

    if (rowsAffected === 0) {
      dbg('RESULT', '→ deactivateOwnAccount() would return TRUE (silent 0-row update)', {
        'error':         null,
        'rows affected': 0,
        consequence:     'signOut() IS called — user appears logged out BUT row unchanged',
        'toast shown':   'NONE — caller sees ok=true and shows success',
        'debug panel':   'update(clients) logged at LOG level, not ERR — invisible in ERR filter',
      });
    } else {
      dbg('RESULT', '→ deactivateOwnAccount() would return TRUE (row updated)', {
        'rows affected':  rowsAffected,
        'new status':     updateData[0]?.status,
        'new user_id':    updateData[0]?.user_id,
        consequence:      'signOut() IS called — account correctly deactivated',
      });
    }
  }

  // ── STEP 5: Check what the row looks like now ─────────────────────────────
  console.log('\n── STEP 5: Verify row state post-UPDATE (admin view, no RLS) ─');
  const verifyRes = await adminFetch(
    `/rest/v1/clients?id=eq.${clientId}&select=id,user_id,status,email`,
    'GET'
  );
  dbg('DB-ADMIN', 'clients row after UPDATE attempt', {
    rows: verifyRes.data,
    note: 'Admin bypass — shows true DB state regardless of RLS',
  });

  // ── STEP 6: signOut (what happens after deactivateOwnAccount returns) ─────
  console.log('\n── STEP 6: supabase.auth.signOut() ─────────────────────────');
  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) {
    dbg('AUTH', 'signOut ERROR', { message: signOutError.message });
  } else {
    dbg('AUTH', 'signOut OK — session cleared');
  }

  // ── CLEANUP ───────────────────────────────────────────────────────────────
  console.log('\n── CLEANUP ──────────────────────────────────────────────────');
  // Delete from clients table first (admin)
  await adminFetch(`/rest/v1/clients?id=eq.${clientId}`, 'DELETE');
  // Delete auth user
  const delRes = await adminFetch(`/auth/v1/admin/users/${testUserId}`, 'DELETE');
  dbg('SETUP', 'Test user deleted', { status: delRes.status });

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  END OF TRACE');
  console.log('══════════════════════════════════════════════════════════════\n');

})().catch(err => {
  console.error('\n[FATAL]', err.message);
  process.exit(1);
});
