// Live clock in the "Today" card.
function tick() {
  const el = document.getElementById("clock");
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

tick();
setInterval(tick, 1000 * 30);
