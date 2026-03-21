#!/bin/sh
set -e

FGA_API_URL="${FGA_API_URL:-http://localhost:8082}"
STORE_NAME="${STORE_NAME:-port}"

# ---------------------------------------------------------------------------
# 1. Wait for OpenFGA to be ready
# ---------------------------------------------------------------------------
echo "Waiting for OpenFGA at $FGA_API_URL ..."
until fga store list --api-url "$FGA_API_URL" >/dev/null 2>&1; do
  sleep 2
done
echo "OpenFGA is ready."

# ---------------------------------------------------------------------------
# 2. Create store + write model (idempotent: skip if name already exists)
# ---------------------------------------------------------------------------
EXISTING_ID=$(
  fga store list --api-url "$FGA_API_URL" \
    | STORE_NAME="$STORE_NAME" node -e 'const fs=require("fs");const data=JSON.parse(fs.readFileSync(0,"utf8"));const name=process.env.STORE_NAME;const store=(data.stores||[]).find((s)=>s.name===name);console.log(store?.id||"")'
)

if [ -n "$EXISTING_ID" ]; then
  echo "Store '$STORE_NAME' already exists (id=$EXISTING_ID). Skipping creation."
  STORE_ID="$EXISTING_ID"
else
  echo "Creating store '$STORE_NAME' and writing model from fga.mod ..."
  RESULT=$(fga store create \
    --api-url "$FGA_API_URL" \
    --name   "$STORE_NAME" \
    --model  ./openfga/fga.mod)
  STORE_ID=$(echo "$RESULT" | node -e 'const fs=require("fs");const data=JSON.parse(fs.readFileSync(0,"utf8"));console.log(data.store?.id||"")')
  echo "Store created: $STORE_ID"
fi

# Read latest auth model details and echo it
MODEL_LIST=$(fga model list --api-url "$FGA_API_URL" --store-id "$STORE_ID")
AUTH_MODEL_ID=$(echo "$MODEL_LIST" | node -e 'const fs=require("fs");const data=JSON.parse(fs.readFileSync(0,"utf8"));console.log(data.authorization_models?.[0]?.id||"")')
echo "Authorization model id: $AUTH_MODEL_ID"
echo "Authorization model list: $MODEL_LIST"

# ---------------------------------------------------------------------------
# 3. Grant admin on platform:global for every user in the Keycloak realm JSON
# ---------------------------------------------------------------------------
REALM_FILE="./keycloak/realm-import/port-dev-realm.json"

echo "Reading users from $REALM_FILE ..."
USERNAMES=$(REALM_FILE="$REALM_FILE" node -e 'const fs=require("fs");const data=JSON.parse(fs.readFileSync(process.env.REALM_FILE,"utf8"));for (const user of (data.users||[])) { if (user?.username) console.log(user.username); }')

for USERNAME in $USERNAMES; do
  echo "  -> user:$USERNAME admin platform:global"
  fga tuple write \
    --api-url      "$FGA_API_URL" \
    --store-id     "$STORE_ID"   \
    --on-duplicate ignore        \
    user:$USERNAME admin platform:global
done

# ---------------------------------------------------------------------------
# 4. Seed domain and domain_classification tuples (copied from mongo seed)
# ---------------------------------------------------------------------------
DOMAIN_PUBLIC_ID="66f000000000000000000011"
DOMAIN_ANALYTICS_ID="66f000000000000000000012"
DOMAIN_SALES_ID="66f000000000000000000013"

CLASS_PUBLIC_DATA_ID="66f000000000000000000001"
CLASS_PII_ID="66f000000000000000000002"
CLASS_FINANCIAL_ID="66f000000000000000000003"

echo "Seeding platform->domain tuples ..."
for DOMAIN_ID in "$DOMAIN_PUBLIC_ID" "$DOMAIN_ANALYTICS_ID" "$DOMAIN_SALES_ID"; do
  echo "  -> platform:global platform domain:$DOMAIN_ID"
  fga tuple write \
    --api-url      "$FGA_API_URL" \
    --store-id     "$STORE_ID"   \
    --on-duplicate ignore        \
    platform:global platform domain:$DOMAIN_ID
done

echo "Seeding domain->domain_classification tuples ..."
fga tuple write --api-url "$FGA_API_URL" --store-id "$STORE_ID" --on-duplicate ignore domain:$DOMAIN_PUBLIC_ID domain domain_classification:${DOMAIN_PUBLIC_ID}-${CLASS_PUBLIC_DATA_ID}
fga tuple write --api-url "$FGA_API_URL" --store-id "$STORE_ID" --on-duplicate ignore domain:$DOMAIN_PUBLIC_ID domain domain_classification:${DOMAIN_PUBLIC_ID}-${CLASS_PII_ID}
fga tuple write --api-url "$FGA_API_URL" --store-id "$STORE_ID" --on-duplicate ignore domain:$DOMAIN_PUBLIC_ID domain domain_classification:${DOMAIN_PUBLIC_ID}-${CLASS_FINANCIAL_ID}
fga tuple write --api-url "$FGA_API_URL" --store-id "$STORE_ID" --on-duplicate ignore domain:$DOMAIN_ANALYTICS_ID domain domain_classification:${DOMAIN_ANALYTICS_ID}-${CLASS_PUBLIC_DATA_ID}
fga tuple write --api-url "$FGA_API_URL" --store-id "$STORE_ID" --on-duplicate ignore domain:$DOMAIN_ANALYTICS_ID domain domain_classification:${DOMAIN_ANALYTICS_ID}-${CLASS_PII_ID}
fga tuple write --api-url "$FGA_API_URL" --store-id "$STORE_ID" --on-duplicate ignore domain:$DOMAIN_ANALYTICS_ID domain domain_classification:${DOMAIN_ANALYTICS_ID}-${CLASS_FINANCIAL_ID}
fga tuple write --api-url "$FGA_API_URL" --store-id "$STORE_ID" --on-duplicate ignore domain:$DOMAIN_SALES_ID domain domain_classification:${DOMAIN_SALES_ID}-${CLASS_PUBLIC_DATA_ID}
fga tuple write --api-url "$FGA_API_URL" --store-id "$STORE_ID" --on-duplicate ignore domain:$DOMAIN_SALES_ID domain domain_classification:${DOMAIN_SALES_ID}-${CLASS_PII_ID}
fga tuple write --api-url "$FGA_API_URL" --store-id "$STORE_ID" --on-duplicate ignore domain:$DOMAIN_SALES_ID domain domain_classification:${DOMAIN_SALES_ID}-${CLASS_FINANCIAL_ID}

echo ""
echo "Bootstrap complete."
echo "  Store  : $STORE_NAME ($STORE_ID)"
echo "  Model  : $AUTH_MODEL_ID"
echo "  Admins : $USERNAMES"
