// ---- Live clock in the "Today" card ----
function tick() {
  const el = document.getElementById("clock");
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
tick();
setInterval(tick, 1000 * 30);

// ---- Gmail / Google sign-in gate ----
// Replace with your own OAuth Client ID from Google Cloud Console.
// (APIs & Services -> Credentials -> OAuth client ID -> Web application)
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
const SESSION_KEY = "summerpui_user";

function decodeJwt(token) {
  // Decode the payload of a Google ID token (JWT). This is for display only,
  // NOT a security check — gating here is UX, not server-verified trust.
  const payload = token.split(".")[1];
  const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(decodeURIComponent(escape(json)));
}

function showUnlocked(user) {
  document.getElementById("gate-locked").hidden = true;
  document.getElementById("gate-unlocked").hidden = false;
  document.getElementById("gate-icon").textContent = "🔓";
  document.getElementById("gate-status").textContent = "Unlocked.";
  document.getElementById("gate-name").textContent = user.name || "Signed in";
  document.getElementById("gate-email").textContent = user.email || "";
  const avatar = document.getElementById("gate-avatar");
  if (user.picture) { avatar.src = user.picture; avatar.hidden = false; }
  else { avatar.hidden = true; }
}

function showLocked() {
  document.getElementById("gate-locked").hidden = false;
  document.getElementById("gate-unlocked").hidden = true;
  document.getElementById("gate-icon").textContent = "🔒";
  document.getElementById("gate-status").textContent = "Sign in with Google to unlock this entry.";
}

function onCredential(response) {
  const user = decodeJwt(response.credential);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    name: user.name, email: user.email, picture: user.picture,
  }));
  showUnlocked(user);
}

function signOut() {
  sessionStorage.removeItem(SESSION_KEY);
  if (window.google && google.accounts && google.accounts.id) {
    google.accounts.id.disableAutoSelect();
  }
  showLocked();
}

function initGate() {
  document.getElementById("gate-signout").addEventListener("click", signOut);

  // Restore an existing session (survives page reloads within the tab).
  const saved = sessionStorage.getItem(SESSION_KEY);
  if (saved) { showUnlocked(JSON.parse(saved)); return; }

  if (GOOGLE_CLIENT_ID.startsWith("YOUR_")) {
    document.getElementById("gate-note").textContent =
      "Setup needed: add your Google OAuth Client ID in app.js to enable sign-in.";
    return;
  }

  // Wait for the Google Identity Services library to finish loading.
  function ready() {
    if (!(window.google && google.accounts && google.accounts.id)) {
      return setTimeout(ready, 100);
    }
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: onCredential,
      auto_select: false,
    });
    google.accounts.id.renderButton(document.getElementById("gsi-button"), {
      theme: "outline", size: "large", shape: "pill", text: "signin_with",
    });
  }
  ready();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGate);
} else {
  initGate();
}
