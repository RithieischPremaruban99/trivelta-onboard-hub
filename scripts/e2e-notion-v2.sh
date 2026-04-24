#!/usr/bin/env bash
# =============================================================================
# scripts/e2e-notion-v2.sh
# Automated E2E test — Trivelta Notion v2 flow (prospect → client → live)
# =============================================================================
#
# Usage:
#   export SUPABASE_SERVICE_ROLE_KEY="eyJ..."
#   export SUPABASE_URL="https://mityzsdqonwfhlahvkiw.supabase.co"  # optional
#   ./scripts/e2e-notion-v2.sh
#
# Service role key location:
#   Supabase Dashboard → Project Settings → API → service_role (secret)
#
# This script bypasses RLS for DB setup/verify via PostgREST (service role),
# and calls edge functions with the service role key as the Bearer token.
#
# NOTE: convert-prospect-to-client requires a real user JWT (it calls
#       auth.getUser() to check user_roles). This script simulates the
#       conversion via direct PostgREST SQL, which is the critical Notion
#       data-flow path. Pass SUPABASE_SESSION_TOKEN if you want to invoke
#       the real edge function instead.
# =============================================================================

set -uo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
SUPABASE_URL="${SUPABASE_URL:-https://mityzsdqonwfhlahvkiw.supabase.co}"
FUNCTIONS_URL="${SUPABASE_URL}/functions/v1"
REST_URL="${SUPABASE_URL}/rest/v1"

if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "❌  SUPABASE_SERVICE_ROLE_KEY is not set."
  echo "    Get it from: Supabase Dashboard → Project Settings → API → service_role (secret)"
  exit 1
fi

SRK="${SUPABASE_SERVICE_ROLE_KEY}"
# Use session token for convert-prospect-to-client if provided; otherwise SQL-simulate
SESSION_TOKEN="${SUPABASE_SESSION_TOKEN:-}"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
TEST_NAME="E2E AUTO TEST ${TIMESTAMP}"

# ── Colors ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

PASS=0
FAIL=0
STEP=0
ERRORS=()

step() {
  STEP=$((STEP + 1))
  echo ""
  echo -e "${CYAN}${BOLD}── Step ${STEP}: $1 ──${NC}"
}

pass() {
  PASS=$((PASS + 1))
  echo -e "  ${GREEN}✅  $1${NC}"
}

fail() {
  FAIL=$((FAIL + 1))
  local msg="Step ${STEP}: $1"
  ERRORS+=("$msg")
  echo -e "  ${RED}❌  ${msg}${NC}"
}

info() {
  echo -e "  ${YELLOW}ℹ   $1${NC}"
}

# ── JSON helpers ──────────────────────────────────────────────────────────────
# Uses jq if available, falls back to python3
jq_get() {
  local json="$1" expr="$2"
  if command -v jq &>/dev/null; then
    echo "$json" | jq -r "${expr} // empty" 2>/dev/null || echo ""
  else
    python3 - "$json" "$expr" <<'PYEOF'
import sys, json as j
data = j.loads(sys.argv[1])
expr = sys.argv[2].lstrip('.')
if expr.startswith('[0].'):
    expr = expr[4:]
    if isinstance(data, list):
        data = data[0] if data else {}
for k in expr.split('.'):
    if data is None: break
    if isinstance(data, dict): data = data.get(k)
    else: data = None
print('' if data is None else str(data))
PYEOF
  fi
}

new_uuid() {
  python3 -c "import uuid; print(uuid.uuid4())"
}

now_iso() {
  python3 -c "from datetime import datetime, timezone; print(datetime.now(timezone.utc).isoformat())"
}

json_obj() {
  # json_obj key1 val1 key2 val2 ...
  python3 - "$@" <<'PYEOF'
import sys, json
args = sys.argv[1:]
d = {}
for i in range(0, len(args), 2):
    k, v = args[i], args[i+1]
    if v == 'null': d[k] = None
    elif v == 'true': d[k] = True
    elif v == 'false': d[k] = False
    else:
        try: d[k] = int(v)
        except: d[k] = v
print(json.dumps(d))
PYEOF
}

# ── REST helpers ──────────────────────────────────────────────────────────────
rest_post() {
  local path="$1" body="$2"
  curl -s -X POST "${REST_URL}${path}" \
    -H "apikey: ${SRK}" \
    -H "Authorization: Bearer ${SRK}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "$body"
}

rest_get() {
  local path="$1"
  curl -s -X GET "${REST_URL}${path}" \
    -H "apikey: ${SRK}" \
    -H "Authorization: Bearer ${SRK}"
}

rest_patch() {
  local path="$1" body="$2"
  curl -s -X PATCH "${REST_URL}${path}" \
    -H "apikey: ${SRK}" \
    -H "Authorization: Bearer ${SRK}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "$body"
}

rest_delete() {
  local path="$1"
  curl -s -X DELETE "${REST_URL}${path}" \
    -H "apikey: ${SRK}" \
    -H "Authorization: Bearer ${SRK}" \
    -o /dev/null
}

fn_invoke() {
  local fn="$1" body="$2" token="${3:-$SRK}"
  curl -s -X POST "${FUNCTIONS_URL}/${fn}" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d "$body"
}

# ── State ─────────────────────────────────────────────────────────────────────
PROSPECT_ID=""
CLIENT_ID=""
NOTION_PAGE_ID=""
NOTION_URL=""

# ── Cleanup (always runs) ──────────────────────────────────────────────────────
cleanup() {
  echo ""
  echo -e "${YELLOW}${BOLD}── Cleanup ──────────────────────────────────────────${NC}"
  if [[ -n "${CLIENT_ID}" ]]; then
    rest_delete "/clients?id=eq.${CLIENT_ID}"
    echo -e "  Deleted clients row: ${CLIENT_ID}"
  fi
  if [[ -n "${PROSPECT_ID}" ]]; then
    rest_delete "/prospects?id=eq.${PROSPECT_ID}"
    echo -e "  Deleted prospects row: ${PROSPECT_ID}"
  fi
  echo ""
  if [[ -n "${NOTION_URL}" ]]; then
    echo -e "  ${YELLOW}⚠  Notion page was created — delete it manually:${NC}"
    echo -e "     ${NOTION_URL}"
  fi
}
trap cleanup EXIT

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Trivelta Notion v2 — E2E Test  (${TIMESTAMP})${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════${NC}"
echo "  Test row: ${TEST_NAME}"
echo "  Supabase: ${SUPABASE_URL}"
# =============================================================================
# STEP A — Create prospect row
# =============================================================================
step "Create prospect row"

PROSPECT_ID=$(new_uuid)
info "prospect_id = ${PROSPECT_ID}"

PROSPECT_BODY=$(python3 -c "
import json
print(json.dumps({
  'id': '${PROSPECT_ID}',
  'legal_company_name': '${TEST_NAME}',
  'primary_contact_email': 'e2e-test-${TIMESTAMP}@trivelta-test.invalid',
  'primary_contact_name': 'E2E Test User',
  'contract_status': 'in_discussion',
  'form_progress': 0
}))
")

RESP=$(rest_post "/prospects" "$PROSPECT_BODY")
CREATED_ID=$(jq_get "$RESP" ".[0].id")

if [[ "${CREATED_ID}" == "${PROSPECT_ID}" ]]; then
  pass "Prospect created (id=${PROSPECT_ID})"
else
  fail "Create prospect failed. Response: ${RESP}"
  exit 1
fi

# =============================================================================
# STEP B — Event 1: prospect-submitted-v2 (Notion page creation)
# =============================================================================
step "Event 1 — prospect-submitted-v2 (Notion page creation)"

FN_BODY=$(python3 -c "
import json
print(json.dumps({
  'prospect_id': '${PROSPECT_ID}',
  'client_id': None,
  'client_name': '${TEST_NAME}',
  'primary_contact_name': 'E2E Test User',
  'primary_contact_email': 'e2e-test-${TIMESTAMP}@trivelta-test.invalid',
  'country': 'nigeria',
  'website': 'https://e2e-test.trivelta-test.invalid',
  'drive_link': None
}))
")

RESP=$(fn_invoke "prospect-submitted-v2" "$FN_BODY")
info "Response: ${RESP}"

SUCCESS=$(jq_get "$RESP" ".success")
NOTION_SYNCED=$(jq_get "$RESP" ".notion_synced")
NOTION_PAGE_ID=$(jq_get "$RESP" ".notion_page_id")
NOTION_URL=$(jq_get "$RESP" ".notion_url")

if [[ "${SUCCESS}" == "true" && "${NOTION_SYNCED}" == "true" && -n "${NOTION_PAGE_ID}" ]]; then
  pass "notion_synced=true, page_id=${NOTION_PAGE_ID}"
  info "Notion URL: ${NOTION_URL}"
else
  fail "Expected notion_synced=true + page_id. Got: ${RESP}"
  # Don't exit — continue so cleanup runs for the prospect row
  NOTION_PAGE_ID=""
fi

# =============================================================================
# STEP C — Verify prospects.notion_page_id written
# =============================================================================
step "Verify prospects.notion_page_id stored in DB"

RESP=$(rest_get "/prospects?id=eq.${PROSPECT_ID}&select=id,notion_page_id,notion_sync_pending,notion_sync_error")
DB_PAGE_ID=$(jq_get "$RESP" ".[0].notion_page_id")
SYNC_ERR=$(jq_get "$RESP" ".[0].notion_sync_error")
SYNC_PEND=$(jq_get "$RESP" ".[0].notion_sync_pending")

if [[ -n "${DB_PAGE_ID}" && "${DB_PAGE_ID}" == "${NOTION_PAGE_ID}" ]]; then
  pass "prospects.notion_page_id = ${DB_PAGE_ID}"
else
  fail "Expected notion_page_id=${NOTION_PAGE_ID}, got=${DB_PAGE_ID} (sync_pending=${SYNC_PEND}, error=${SYNC_ERR})"
fi

# =============================================================================
# STEP D — Simulate convert-prospect-to-client
# =============================================================================
step "Simulate convert-prospect-to-client"

if [[ -n "${SESSION_TOKEN}" ]]; then
  info "SUPABASE_SESSION_TOKEN provided → invoking real edge function"
  FN_BODY=$(python3 -c "
import json
print(json.dumps({
  'prospect_id': '${PROSPECT_ID}',
  'submitted_by': 'e2e-test',
  'submitter_email': 'e2e-test@trivelta-test.invalid',
  'app_origin': 'https://trivelta-test.invalid'
}))
")
  RESP=$(fn_invoke "convert-prospect-to-client" "$FN_BODY" "$SESSION_TOKEN")
  info "Response: ${RESP}"

  OK=$(jq_get "$RESP" ".ok")
  CLIENT_ID=$(jq_get "$RESP" ".client_id")

  if [[ ("${OK}" == "true" || "${OK}" == "null") && -n "${CLIENT_ID}" ]]; then
    pass "convert-prospect-to-client: client_id=${CLIENT_ID}"
  else
    fail "convert-prospect-to-client returned: ${RESP}"
    exit 1
  fi
else
  info "No SUPABASE_SESSION_TOKEN → simulating via direct SQL (edge fn requires user JWT)"
  info "This is sufficient for testing the Notion data-flow path."

  CLIENT_ID=$(new_uuid)
  info "client_id = ${CLIENT_ID}"

  # Create clients row — mirrors what convert-prospect-to-client does
  CLIENT_BODY=$(python3 -c "
import json
print(json.dumps({
  'id': '${CLIENT_ID}',
  'name': '${TEST_NAME}',
  'primary_contact_email': 'e2e-test-${TIMESTAMP}@trivelta-test.invalid',
  'studio_access': False,
  'status': 'onboarding',
  'notion_page_id': '${NOTION_PAGE_ID}' if '${NOTION_PAGE_ID}' else None,
  'onboarding_phase': 'Pre-Sale'
}))
")
  RESP=$(rest_post "/clients" "$CLIENT_BODY")
  CREATED_CLIENT=$(jq_get "$RESP" ".[0].id")

  if [[ "${CREATED_CLIENT}" == "${CLIENT_ID}" ]]; then
    pass "clients row created (id=${CLIENT_ID})"
  else
    fail "Create client failed. Response: ${RESP}"
    exit 1
  fi

  # Stamp prospect.converted_to_client_id immediately (mirrors fix from 0a111b3)
  CONVERT_PATCH=$(python3 -c "
import json
from datetime import datetime, timezone
print(json.dumps({
  'converted_to_client_id': '${CLIENT_ID}',
  'converted_at': datetime.now(timezone.utc).isoformat()
}))
")
  rest_patch "/prospects?id=eq.${PROSPECT_ID}" "$CONVERT_PATCH" > /dev/null
  pass "prospects.converted_to_client_id stamped → ${CLIENT_ID}"
fi

# =============================================================================
# STEP E — Verify clients row: notion_page_id + onboarding_phase
# =============================================================================
step "Verify clients row: notion_page_id copied + onboarding_phase=Pre-Sale"

RESP=$(rest_get "/clients?id=eq.${CLIENT_ID}&select=id,name,onboarding_phase,notion_page_id")
CL_PHASE=$(jq_get "$RESP" ".[0].onboarding_phase")
CL_PAGE_ID=$(jq_get "$RESP" ".[0].notion_page_id")

OK=true
if [[ "${CL_PHASE}" != "Pre-Sale" ]]; then
  fail "Expected onboarding_phase=Pre-Sale, got='${CL_PHASE}'"
  OK=false
fi
if [[ -n "${NOTION_PAGE_ID}" && "${CL_PAGE_ID}" != "${NOTION_PAGE_ID}" ]]; then
  fail "Expected notion_page_id=${NOTION_PAGE_ID}, got='${CL_PAGE_ID}'"
  OK=false
fi
if $OK; then
  pass "onboarding_phase=Pre-Sale, notion_page_id=${CL_PAGE_ID}"
fi

# =============================================================================
# STEP F — Event 2: contract-signed
# =============================================================================
step "Event 2 — contract-signed"

FN_BODY=$(python3 -c "import json; print(json.dumps({'client_id': '${CLIENT_ID}'}))")
RESP=$(fn_invoke "contract-signed" "$FN_BODY")
info "Response: ${RESP}"

SUCCESS=$(jq_get "$RESP" ".success")
NOTION_SYNCED=$(jq_get "$RESP" ".notion_synced")

if [[ "${SUCCESS}" == "true" ]]; then
  pass "contract-signed: success=true (notion_synced=${NOTION_SYNCED})"
else
  fail "contract-signed returned: ${RESP}"
fi

# =============================================================================
# STEP G — Verify contract fields
# =============================================================================
step "Verify clients row: onboarding_phase=Contract + contract dates"

RESP=$(rest_get "/clients?id=eq.${CLIENT_ID}&select=onboarding_phase,contract_signed_at,contract_start_date")
CL_PHASE=$(jq_get "$RESP" ".[0].onboarding_phase")
CL_SIGNED=$(jq_get "$RESP" ".[0].contract_signed_at")
CL_START=$(jq_get "$RESP" ".[0].contract_start_date")

OK=true
[[ "${CL_PHASE}" != "Contract" ]] && { fail "Expected phase=Contract, got='${CL_PHASE}'"; OK=false; }
[[ -z "${CL_SIGNED}" ]] && { fail "contract_signed_at is NULL (expected timestamp)"; OK=false; }
[[ -z "${CL_START}" ]] && { fail "contract_start_date is NULL (expected date)"; OK=false; }
if $OK; then
  pass "phase=Contract, contract_signed_at=${CL_SIGNED}, contract_start_date=${CL_START}"
fi

# =============================================================================
# STEP H — Advance phase to Pre-Launch (AM workflow simulation)
# =============================================================================
step "Advance onboarding_phase → Pre-Launch (simulating AM workflow in admin UI)"

rest_patch "/clients?id=eq.${CLIENT_ID}" '{"onboarding_phase":"Pre-Launch"}' > /dev/null

RESP=$(rest_get "/clients?id=eq.${CLIENT_ID}&select=onboarding_phase")
CL_PHASE=$(jq_get "$RESP" ".[0].onboarding_phase")

if [[ "${CL_PHASE}" == "Pre-Launch" ]]; then
  pass "onboarding_phase=Pre-Launch"
else
  fail "Expected Pre-Launch, got='${CL_PHASE}'"
fi

# =============================================================================
# STEP I — Event 3: go-live
# =============================================================================
step "Event 3 — go-live"

FN_BODY=$(python3 -c "import json; print(json.dumps({'client_id': '${CLIENT_ID}'}))")
RESP=$(fn_invoke "go-live" "$FN_BODY")
info "Response: ${RESP}"

SUCCESS=$(jq_get "$RESP" ".success")
NOTION_SYNCED=$(jq_get "$RESP" ".notion_synced")

if [[ "${SUCCESS}" == "true" ]]; then
  pass "go-live: success=true (notion_synced=${NOTION_SYNCED})"
else
  fail "go-live returned: ${RESP}"
fi

# =============================================================================
# STEP J — Verify post-launch fields
# =============================================================================
step "Verify clients row: onboarding_phase=Post-Launch + go-live fields"

RESP=$(rest_get "/clients?id=eq.${CLIENT_ID}&select=onboarding_phase,health_score,go_live_date,next_renewal_date,notion_sync_error")
CL_PHASE=$(jq_get "$RESP" ".[0].onboarding_phase")
CL_HEALTH=$(jq_get "$RESP" ".[0].health_score")
CL_LIVE=$(jq_get "$RESP" ".[0].go_live_date")
CL_RENEWAL=$(jq_get "$RESP" ".[0].next_renewal_date")
SYNC_ERR=$(jq_get "$RESP" ".[0].notion_sync_error")

OK=true
[[ "${CL_PHASE}" != "Post-Launch" ]] && { fail "Expected phase=Post-Launch, got='${CL_PHASE}'"; OK=false; }
[[ "${CL_HEALTH}" != "Good" ]]      && { fail "Expected health_score=Good, got='${CL_HEALTH}'"; OK=false; }
[[ -z "${CL_LIVE}" ]]               && { fail "go_live_date is NULL"; OK=false; }
[[ -z "${CL_RENEWAL}" ]]            && { fail "next_renewal_date is NULL"; OK=false; }
[[ -n "${SYNC_ERR}" ]] && info "notion_sync_error: ${SYNC_ERR}"
if $OK; then
  pass "phase=Post-Launch, health=Good, go_live=${CL_LIVE}, next_renewal=${CL_RENEWAL}"
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════${NC}"
if [[ ${FAIL} -eq 0 ]]; then
  echo -e "${GREEN}${BOLD}  ✅  ALL PASSED  (${PASS}/${PASS} steps)${NC}"
else
  echo -e "${RED}${BOLD}  ❌  ${FAIL} FAILED, ${PASS} passed${NC}"
  for ERR in "${ERRORS[@]}"; do
    echo -e "  ${RED}→ ${ERR}${NC}"
  done
fi
echo -e "${BOLD}═══════════════════════════════════════════════════════${NC}"
echo ""
if [[ -n "${NOTION_URL}" ]]; then
  echo -e "  Notion page: ${NOTION_URL}"
  echo -e "  ${YELLOW}→ Open URL above and move to Trash in Notion${NC}"
fi
echo ""

[[ ${FAIL} -eq 0 ]] && exit 0 || exit 1
