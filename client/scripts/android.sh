#!/usr/bin/env bash
set -eo pipefail

# =============================================================================
# Build de la app Android (Capacitor) de Atlass Fin.
#
# Uso:
#   ./scripts/android.sh --list                       # lista AVDs y dispositivos conectados
#   ./scripts/android.sh                              # build web + sync + APK debug
#   ./scripts/android.sh --run                        # build + menú para elegir dispositivo + instalar/lanzar
#   ./scripts/android.sh --run --emulator Pixel_10_Pro_XL # elegir AVD
#   ./scripts/android.sh --run --device <serial>      # instalar en un dispositivo conectado (adb)
#
# Requisitos: nvm (Node >=22 lo pide Capacitor 8) y SDKMAN (JDK 21 vía .sdkmanrc)
#             + Android SDK (por defecto $HOME/Library/Android/sdk).
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLIENT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$CLIENT_DIR"

APP_ID="com.atlassfin.app"

usage() {
  sed -n 's/^# \{0,1\}//p' "$0" | sed -n '3,14p'
  exit 1
}

# --- Android SDK ------------------------------------------------------------
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
ADB="$ANDROID_HOME/platform-tools/adb"
EMULATOR="$ANDROID_HOME/emulator/emulator"

[ -x "$ADB" ] || { echo "❌ No se encontró adb en \$ANDROID_HOME ($ANDROID_HOME)." >&2; exit 1; }

# --- Node >= 22 (lo pide Capacitor 8) --------------------------------------
ensure_node() {
  if ! command -v node >/dev/null 2>&1; then return; fi
  local major
  major="$(node -p 'process.versions.node.split(".")[0]')"
  if [ "$major" -lt 22 ] && [ -s "$HOME/.nvm/nvm.sh" ]; then
    # shellcheck disable=SC1091
    source "$HOME/.nvm/nvm.sh"
    nvm use 22 >/dev/null 2>&1 || nvm use 24 >/dev/null 2>&1 || true
  fi
}
ensure_node

# --- JDK 21 (lo pide Gradle 8.x) vía SDKMAN + .sdkmanrc --------------------
ensure_jdk() {
  local version
  version="$(grep -m1 '^java=' .sdkmanrc 2>/dev/null | cut -d= -f2)"
  if [ -n "$version" ] && [ -d "$HOME/.sdkman/candidates/java/$version" ]; then
    export JAVA_HOME="$HOME/.sdkman/candidates/java/$version"
    export PATH="$JAVA_HOME/bin:$PATH"
  fi
}
ensure_jdk

# --- Dispositivos ------------------------------------------------------------
# adb devices → "SERIAL state" (físico o emulador ya encendido)
connected_devices() {
  "$ADB" devices | awk 'NR>1 && $2=="device" {print $1}'
}

list_all() {
  echo "AVDs disponibles:"
  if command -v "$EMULATOR" >/dev/null 2>&1 && [ -x "$EMULATOR" ]; then
    "$EMULATOR" -list-avds 2>/dev/null | sed 's/^/  AVD  /'
  else
    echo "  (emulador no instalado en \$ANDROID_HOME)"
  fi
  echo "Dispositivos conectados (adb):"
  local n=0
  while read -r s; do [ -n "$s" ] && { echo "  adb   $s"; n=1; }; done < <(connected_devices)
  [ "$n" = "0" ] && echo "  (ninguno)"
}

# Devuelve TARGET=single|boot y TARGET_ID
pick_device() {
  local emu_arg="$1" dev_arg="$2"
  local -a avds=()
  if [ -x "$EMULATOR" ]; then
    while IFS= read -r a; do [ -n "$a" ] && avds+=("$a"); done < <("$EMULATOR" -list-avds 2>/dev/null)
  fi
  local -a conn=()
  while IFS= read -r c; do [ -n "$c" ] && conn+=("$c"); done < <(connected_devices)

  if [ -n "$emu_arg" ]; then
    local found=""
    for a in "${avds[@]}"; do [ "$a" = "$emu_arg" ] && found=1 && break; done
    [ -n "$found" ] || { echo "❌ AVD '$emu_arg' no existe. Usá ./scripts/android.sh --list" >&2; exit 1; }
    TARGET="boot"; TARGET_ID="$emu_arg"
    return
  fi
  if [ -n "$dev_arg" ]; then
    local found=""
    for c in "${conn[@]}"; do [ "$c" = "$dev_arg" ] && found=1 && break; done
    [ -n "$found" ] || { echo "❌ '$dev_arg' no está conectado (adb devices)." >&2; exit 1; }
    TARGET="adb"; TARGET_ID="$dev_arg"
    return
  fi

  [ "${#avds[@]}" -eq 0 ] && [ "${#conn[@]}" -eq 0 ] && { echo "❌ No hay dispositivos Android disponibles." >&2; exit 1; }

  echo "Dispositivos disponibles:"
  local i=1
  for c in "${conn[@]}"; do printf '  %d) 📱 adb: %s\n' "$i" "$c"; ((i++)); done
  for a in "${avds[@]}"; do printf '  %d) 💻 AVD: %s\n' "$i" "$a"; ((i++)); done
  local sel
  read -r -p "Elegí un número (default 1): " sel
  sel="${sel:-1}"
  local total=$(( ${#conn[@]} + ${#avds[@]} ))
  [[ "$sel" =~ ^[0-9]+$ ]] && [ "$sel" -ge 1 ] && [ "$sel" -le "$total" ] || { echo "❌ Selección inválida." >&2; exit 1; }

  if [ "$sel" -le "${#conn[@]}" ]; then
    TARGET="adb"; TARGET_ID="${conn[$((sel - 1))]}"
  else
    TARGET="boot"; TARGET_ID="${avds[$((sel - ${#conn[@]} - 1))]}"
  fi
}

# --- Flags -------------------------------------------------------------------
MODE="build"
EMU_ARG=""
DEV_ARG=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --list) MODE="list"; shift ;;
    --run) MODE="run"; shift ;;
    --emulator) EMU_ARG="${2:-}"; shift 2 ;;
    --device) DEV_ARG="${2:-}"; shift 2 ;;
    *) usage ;;
  esac
done

if [ "$MODE" = "list" ]; then
  list_all
  exit 0
fi

if [ "$MODE" = "run" ]; then
  pick_device "$EMU_ARG" "$DEV_ARG"
fi

echo "▶ Build web (Next.js static export → out/)..."
npm run build

echo "▶ Sync Capacitor → android/"
npx cap sync android

echo "▶ Build APK debug (gradlew assembleDebug)..."
(cd android && ./gradlew assembleDebug)

APK="android/app/build/outputs/apk/debug/app-debug.apk"
echo "✅ APK generado: $APK"

if [ "$MODE" = "run" ]; then
  if [ "$TARGET" = "boot" ]; then
    echo "▶ Arrancando emulador ($TARGET_ID)..."
    "$EMULATOR" -avd "$TARGET_ID" >/dev/null 2>&1 &
    echo "▶ Esperando boot..."
    "$ADB" wait-for-device
    until [ "$("$ADB" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
      sleep 2
    done
    ADB_DEVICE="$(connected_devices | head -1)"
    [ -n "$ADB_DEVICE" ] || { echo "❌ No apareció el emulador en adb." >&2; exit 1; }
  else
    ADB_DEVICE="$TARGET_ID"
  fi

  echo "▶ Instalando APK en $ADB_DEVICE..."
  "$ADB" -s "$ADB_DEVICE" install -r "$APK"

  echo "▶ Lanzando app..."
  "$ADB" -s "$ADB_DEVICE" shell am start -n "$APP_ID/.MainActivity"
fi
