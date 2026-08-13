// Measure the real available viewport height in JS (rather than relying on
// the CSS vh unit, which mis-measures inside mobile browser chrome and
// embedded viewers) so the gallery can reliably pin content to the bottom.
// visualViewport tracks the actually-visible area more accurately than
// window.innerHeight inside nested/embedded viewers; re-run on a short
// delay too, since some host containers resize the frame after load.
function setAppHeight() {
  const h = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
  document.documentElement.style.setProperty('--app-height', h + 'px');
}
setAppHeight();
window.addEventListener('resize', setAppHeight);
window.addEventListener('orientationchange', setAppHeight);
window.addEventListener('load', setAppHeight);
window.addEventListener('scroll', setAppHeight, { passive: true });
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', setAppHeight);
  window.visualViewport.addEventListener('scroll', setAppHeight);
}
[100, 300, 800, 1500, 3000].forEach((delay) => setTimeout(setAppHeight, delay));

// Debug overlay: append ?debug=1 to the URL to see live viewport
// measurements on-screen — used to diagnose the mobile bottom-flush
// gap on a real device without needing remote access to it.
if (location.search.includes('debug=1')) {
  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:rgba(0,0,0,0.85);color:#0f0;font:11px/1.5 monospace;padding:8px;white-space:pre;pointer-events:none;';
  document.body.appendChild(panel);
  function updatePanel() {
    const track = document.getElementById('galleryTrack');
    const img = track ? track.querySelector('.project-thumb') : null;
    const rect = img ? img.getBoundingClientRect() : null;
    panel.textContent = [
      'innerHeight: ' + window.innerHeight,
      'visualViewport.h: ' + (window.visualViewport ? Math.round(window.visualViewport.height) : 'n/a'),
      'visualViewport.offsetTop: ' + (window.visualViewport ? Math.round(window.visualViewport.offsetTop) : 'n/a'),
      'screen.height: ' + window.screen.height,
      'docEl.clientHeight: ' + document.documentElement.clientHeight,
      'scrollHeight: ' + document.documentElement.scrollHeight,
      '--app-height: ' + getComputedStyle(document.documentElement).getPropertyValue('--app-height'),
      'body computed minHeight: ' + getComputedStyle(document.body).minHeight,
      'img bottom: ' + (rect ? Math.round(rect.bottom) : 'n/a'),
      'gap (innerHeight - img.bottom): ' + (rect ? Math.round(window.innerHeight - rect.bottom) : 'n/a'),
      'devicePixelRatio: ' + window.devicePixelRatio,
      'scrollY: ' + window.scrollY,
    ].join('\n');
  }
  updatePanel();
  window.addEventListener('resize', updatePanel);
  window.addEventListener('scroll', updatePanel, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updatePanel);
    window.visualViewport.addEventListener('scroll', updatePanel);
  }
  setInterval(updatePanel, 500);
}

const track = document.getElementById('galleryTrack');
let dragged = false;

if (track) {
  // Convert vertical wheel motion into horizontal scroll while hovering the gallery
  track.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      track.scrollLeft += e.deltaY;
    }
  }, { passive: false });

  // Click-and-drag horizontal scroll (desktop)
  let isDown = false;
  let startX = 0;
  let startScrollLeft = 0;

  track.addEventListener('mousedown', (e) => {
    isDown = true;
    dragged = false;
    startX = e.pageX;
    startScrollLeft = track.scrollLeft;
  });

  window.addEventListener('mouseup', () => {
    isDown = false;
  });

  track.addEventListener('mouseleave', () => {
    isDown = false;
  });

  track.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const delta = e.pageX - startX;
    if (Math.abs(delta) > 5) dragged = true;
    track.scrollLeft = startScrollLeft - delta;
  });

  // Prevent link navigation from firing right after a drag
  track.querySelectorAll('.project-thumb').forEach((link) => {
    link.addEventListener('click', (e) => {
      if (dragged) {
        e.preventDefault();
      }
    });
  });
}

// Mobile nav menu — a scrim dims the real page content in place
// (no separate drawer screen or cloned gallery).
const menuToggle = document.getElementById('menuToggle');
const menuScrim = document.getElementById('menuScrim');

function setMenuOpen(open) {
  document.body.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
}

menuToggle.addEventListener('click', () => {
  setMenuOpen(!document.body.classList.contains('menu-open'));
});

menuScrim.addEventListener('click', () => setMenuOpen(false));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
    setMenuOpen(false);
  }
});
