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
const GOOGLE_CLIENT_ID = "906540452923-r0tulsk0cqr9oikdmcj44o4b47o0hm0g.apps.googleusercontent.com";
const SESSION_KEY = "summerpui_user";

// ---- Who is allowed in ----
// Add the Google account emails that may unlock the personal UI.
// NOTE: this runs in the browser, so it is a convenience gate, NOT real
// security — anyone can read/edit this file. For true access control,
// verify the account on a server (e.g. Cloudflare Access).
const ALLOWED_EMAILS = [
  "chunhui.shi@gmail.com",
  "urania.w.shi@gmail.com",
  "yiyi.zengs@gmail.com",
];

function isAllowed(user) {
  const email = (user && user.email || "").toLowerCase();
  if (!email || user.email_verified === false) return false;
  return ALLOWED_EMAILS.some((e) => e.toLowerCase() === email);
}

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
  document.getElementById("gate-name").textContent = user.name || "Signed in";
  document.getElementById("gate-email").textContent = user.email || "";
  const avatar = document.getElementById("gate-avatar");
  if (user.picture) { avatar.src = user.picture; avatar.hidden = false; }
  else { avatar.hidden = true; }
}

function showLocked() {
  document.getElementById("gate-locked").hidden = false;
  document.getElementById("gate-unlocked").hidden = true;
}

function onCredential(response) {
  const user = decodeJwt(response.credential);
  if (!isAllowed(user)) {
    document.getElementById("gate-note").textContent =
      `${user.email || "That account"} isn't on the allow list.`;
    if (window.google && google.accounts && google.accounts.id) {
      google.accounts.id.disableAutoSelect();
    }
    return;
  }
  document.getElementById("gate-note").textContent = "";
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
  if (saved) {
    const user = JSON.parse(saved);
    if (isAllowed(user)) { showUnlocked(user); return; }
    sessionStorage.removeItem(SESSION_KEY);  // no longer on the list
  }

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
