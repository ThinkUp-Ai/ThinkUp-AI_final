// Diesen Code in einen <script> Tag in Layout.astro oder in src/scripts/main.js einfügen

function smoothBackgroundTransitions() {
    const sections = document.querySelectorAll('section[data-section-bg-color]');
    const body = document.body;
  
    if (sections.length === 0 || !body) return;
  
    // --- Initialen Zustand setzen ---
    let initialSectionSet = false;
    // Finde die erste Sektion, die bereits im Viewport ist (z.B. nach einem Neuladen in der Mitte der Seite)
    // oder die oberste Sektion, falls keine andere sichtbar ist.
    const visibleSections = Array.from(sections).filter(section => {
      const rect = section.getBoundingClientRect();
      // Prüft, ob irgendein Teil der Sektion im Viewport ist
      return rect.top < window.innerHeight && rect.bottom > 0;
    });
  
    if (visibleSections.length > 0) {
      // Nimm die oberste der aktuell sichtbaren Sektionen
      visibleSections.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      const currentSection = visibleSections[0];
      const initialBgColor = currentSection.dataset.sectionBgColor || 'var(--color-primary)';
      const initialBodyClass = currentSection.dataset.bodyClass || 'dark-background';
      
      body.style.backgroundColor = initialBgColor;
      body.classList.remove('light-background', 'dark-background');
      body.classList.add(initialBodyClass);
      initialSectionSet = true;
    }
    
    // Fallback, falls keine Sektion als initial sichtbar erkannt wurde (sollte selten sein)
    if (!initialSectionSet && sections.length > 0) {
      const firstSection = sections[0];
      const fallbackBgColor = firstSection.dataset.sectionBgColor || 'var(--color-primary)';
      const fallbackBodyClass = firstSection.dataset.bodyClass || 'dark-background';
      body.style.backgroundColor = fallbackBgColor;
      body.classList.remove('light-background', 'dark-background');
      body.classList.add(fallbackBodyClass);
    }
    // --- Ende Initialen Zustand setzen ---
  
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      // Schwellenwert so anpassen, dass der Wechsel passiert, wenn die Sektion dominant wird.
      // Ein Array von Thresholds kann auch nützlich sein, um genauer zu steuern,
      // wann die Intersection als "aktiv" gilt.
      // Hier z.B. wenn die Mitte der Sektion etwa die Mitte des Viewports erreicht.
      // rootMargin könnte hier auch helfen, z.B. "-50% 0px -50% 0px" um den Triggerpunkt in die Mitte des Viewports zu legen.
      threshold: 0.55 // Auslösen, wenn 55% des Elements sichtbar sind
    };
  
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { // Diese Sektion ist jetzt die dominante
          const bgColor = entry.target.dataset.sectionBgColor;
          const bodyClass = entry.target.dataset.bodyClass;
  
          if (bgColor) {
            body.style.backgroundColor = bgColor;
          }
          if (bodyClass) {
            body.classList.remove('light-background', 'dark-background');
            body.classList.add(bodyClass);
          }
        }
      });
    }, observerOptions);
  
    sections.forEach(section => {
      observer.observe(section);
    });
  }
  
  // Stelle sicher, dass das Skript nach dem Laden der Seite und bei Astro View Transitions ausgeführt wird
  if (document.readyState === 'loading') {
    document.addEventListener('astro:page-load', smoothBackgroundTransitions, { once: true });
  } else {
    smoothBackgroundTransitions();
  }
  // Für wiederholte Ausführung bei Client-seitiger Navigation (falls astro:page-load nicht reicht)
  // document.addEventListener('astro:after-swap', smoothBackgroundTransitions);