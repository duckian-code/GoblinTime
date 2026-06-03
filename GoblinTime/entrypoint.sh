#!/bin/sh
# entrypoint.sh — inject runtime env vars for the SPA

CONFIG_JS="/usr/share/nginx/html/env-config.js"

# Escape backslashes and double quotes for safe JavaScript string embedding
escape_js() {
    printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

cat > "$CONFIG_JS" << EOF
// Generated at container startup — do not edit manually
window.__ENV__ = {
  VITE_WS_URL: "$(escape_js "${VITE_WS_URL}")",
  VITE_USER_SERVICE_URL: "",
  VITE_AUTH_SERVICE_URL: "",
  VITE_LIVEKIT_SERVICE_URL: "$(escape_js "${VITE_LIVEKIT_SERVICE_URL}")",
  VITE_LIVEKIT_ENDPOINT: "$(escape_js "${VITE_LIVEKIT_ENDPOINT}")",
  VITE_REGISTER_ENDPOINT: "$(escape_js "${VITE_REGISTER_ENDPOINT}")",
  VITE_LOGIN_ENDPOINT: "$(escape_js "${VITE_LOGIN_ENDPOINT}")",
  VITE_CONTACTS_ENDPOINT: "$(escape_js "${VITE_CONTACTS_ENDPOINT}")",
  VITE_USER_ENDPOINT: "$(escape_js "${VITE_USER_ENDPOINT}")",
  VITE_RECOMMENDED_ENDPOINT: "$(escape_js "${VITE_RECOMMENDED_ENDPOINT}")",
};
EOF


# Inject a <script> tag into index.html so the SPA loads env-config.js before the app bundle
HTML_FILE="/usr/share/nginx/html/index.html"
if grep -q 'env-config.js' "$HTML_FILE"; then
  echo "env-config.js script tag already exists in index.html"
else
  sed -i 's|<head>|<head>\n    <script src="/env-config.js"></script>|' "$HTML_FILE"
fi

echo "Runtime config written:"
cat "$CONFIG_JS"