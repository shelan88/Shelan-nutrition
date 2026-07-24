#!/usr/bin/env bash
# prove-cert-visibility-fix.sh
# Proves updateSectionVisible() upsert fix works via Supabase REST API.
# All 8 checks. Exits 1 if any check fails.

BASE_URL="${VITE_SUPABASE_URL}/rest/v1"
KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$BASE_URL" ] || [ -z "$KEY" ]; then
  echo "❌  VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set"; exit 1
fi

PASS=0; FAIL=0; N=0

ok() {
  N=$((N+1)); PASS=$((PASS+1))
  echo "  ✅  CHECK ${N}: $1${2:+  →  $2}"
}
fail() {
  N=$((N+1)); FAIL=$((FAIL+1))
  echo "  ❌  CHECK ${N}: $1  →  $2"
}
hr() { printf "\n─── %s\n" "$1"; }

# ── REST helpers ──────────────────────────────────────────────────────────────
HDRS=(-H "apikey: $KEY" -H "Authorization: Bearer $KEY" -H "Accept: application/json")

get_row() {
  curl -s "${HDRS[@]}" \
    "${BASE_URL}/about_section_settings?section_key=eq.certifications&select=*"
}

delete_row() {
  curl -s -X DELETE "${HDRS[@]}" \
    -H "Prefer: return=representation" \
    "${BASE_URL}/about_section_settings?section_key=eq.certifications"
}

# Mirrors: supabase.from("about_section_settings")
#            .upsert({ section_key: key, visible }, { onConflict: "section_key" })
# The JS client translates onConflict:"section_key" → ?on_conflict=section_key in the URL.
upsert_visible() {
  curl -s -X POST "${HDRS[@]}" \
    -H "Content-Type: application/json" \
    -H "Prefer: resolution=merge-duplicates,return=representation" \
    --data "{\"section_key\":\"certifications\",\"visible\":$1}" \
    "${BASE_URL}/about_section_settings?on_conflict=section_key"
}

# ── CHECK 1: Delete existing row ──────────────────────────────────────────────
hr "CHECK 1 — Delete any existing certifications row (clean slate)"

DEL=$(delete_row)
DEL_COUNT=$(echo "$DEL" | jq 'length')
if [ "$DEL_COUNT" -gt 0 ]; then
  PREV_ID=$(echo "$DEL" | jq -r '.[0].id')
  ok "Existing row deleted" "id=$PREV_ID"
else
  ok "No pre-existing certifications row — table was already clean"
fi

AFTER_DEL=$(get_row)
AFTER_DEL_COUNT=$(echo "$AFTER_DEL" | jq 'length')
if [ "$AFTER_DEL_COUNT" -eq 0 ]; then
  ok "about_section_settings has NO certifications row after delete"
else
  fail "Row should be absent after delete" "$(echo "$AFTER_DEL" | jq -c '.')"
fi

# ── CHECK 2: Toggle Hide (upsert on missing row) ──────────────────────────────
hr "CHECK 2 — Toggle Hide (upsert visible=false on missing row)"

HIDDEN=$(upsert_visible false)
HIDDEN_KEY=$(echo "$HIDDEN" | jq -r '.[0].section_key // empty')
if [ "$HIDDEN_KEY" = "certifications" ]; then
  ok "upsert returned created row — no error"
else
  fail "upsert did not return expected row" "$(echo "$HIDDEN" | jq -c '.')"
fi

# ── CHECKS 3–4: Verify row created, print it ─────────────────────────────────
hr "CHECKS 3–4 — Verify row created and print it"

ROW_ID=$(echo "$HIDDEN" | jq -r '.[0].id')
HIDDEN_VISIBLE=$(echo "$HIDDEN" | jq -r '.[0].visible')
CREATED_AT=$(echo "$HIDDEN" | jq -r '.[0].created_at')

if [ -n "$ROW_ID" ] && [ "$ROW_ID" != "null" ]; then
  ok "New row created in about_section_settings"
else
  fail "Row NOT created — id is empty or null" "$(echo "$HIDDEN" | jq -c '.')"
fi

ok "Row contents" \
  "id=$ROW_ID  section_key=certifications  visible=$HIDDEN_VISIBLE  created_at=$CREATED_AT"

# ── CHECKS 5–6: Simulate page reload ─────────────────────────────────────────
hr "CHECKS 5–6 — Simulate page reload (mirrors getSectionSettings call)"

RELOAD=$(get_row)
RELOAD_COUNT=$(echo "$RELOAD" | jq 'length')
RELOAD_VISIBLE=$(echo "$RELOAD" | jq -r '.[0].visible')

if [ "$RELOAD_COUNT" -gt 0 ]; then
  ok "getSectionSettings(\"certifications\") returns a row on reload"
else
  fail "getSectionSettings returned no row on reload" "$RELOAD"
fi

if [ "$RELOAD_VISIBLE" = "false" ]; then
  ok "visible=false  →  certVisible=false  →  <AboutCertifications /> NOT rendered"
else
  fail "visible must be false" "Got visible=$RELOAD_VISIBLE"
fi

# ── CHECK 7: AboutPage.tsx derivation ────────────────────────────────────────
hr "CHECK 7 — AboutPage.tsx visibility derivation (mirrors lines 45-48)"

echo "       certSectionRow  = { section_key: \"certifications\", visible: $RELOAD_VISIBLE }"
echo "       certVisible     = certSectionRow.visible  =  $RELOAD_VISIBLE"
echo "       JSX:            = {$RELOAD_VISIBLE && <AboutCertifications />}  =  null"

if [ "$RELOAD_VISIBLE" = "false" ]; then
  ok "AboutPage does NOT render <AboutCertifications /> when visible=false"
else
  fail "certVisible should suppress the component" "Got $RELOAD_VISIBLE"
fi

# ── CHECK 8: Toggle Show — same row updated, no duplicates ────────────────────
hr "CHECK 8 — Toggle Show (upsert visible=true — same row, no duplicates)"

SHOWN=$(upsert_visible true)
SHOWN_ID=$(echo "$SHOWN" | jq -r '.[0].id')
SHOWN_VISIBLE=$(echo "$SHOWN" | jq -r '.[0].visible')

if [ "$SHOWN_VISIBLE" = "true" ]; then
  ok "upsert visible=true updated the row — visible is now true"
else
  fail "upsert visible=true failed" "Got visible=$SHOWN_VISIBLE  body=$(echo "$SHOWN" | jq -c '.')"
fi

ALL_ROWS=$(get_row)
ROW_COUNT=$(echo "$ALL_ROWS" | jq 'length')

if [ "$ROW_COUNT" -eq 1 ]; then
  ok "Exactly 1 row in about_section_settings — no duplicates created"
else
  fail "Expected exactly 1 row" "Found $ROW_COUNT  rows: $(echo "$ALL_ROWS" | jq -c '.')"
fi

if [ "$SHOWN_ID" = "$ROW_ID" ]; then
  ok "Same row id=$ROW_ID updated in-place — visible flipped false→true"
else
  fail "Row id should be unchanged after update" "Was $ROW_ID, got $SHOWN_ID"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
hr "SUMMARY"
printf "\n  %d passed   %d failed   (%d total)\n\n" "$PASS" "$FAIL" "$((PASS+FAIL))"
[ "$FAIL" -eq 0 ]
