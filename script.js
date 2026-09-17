document.addEventListener('DOMContentLoaded', () => {
    const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

    /* ---------------------------------------------------------------
       Reveal sections on scroll
       --------------------------------------------------------------- */
    const animated = document.querySelectorAll('.fade-in, .slide-up');

    if (reduceMotion || !('IntersectionObserver' in window)) {
        animated.forEach((el) => el.classList.add('in-view'));
    } else {
        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target); // reveal once
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );

        animated.forEach((el) => revealObserver.observe(el));
    }

    /* ---------------------------------------------------------------
       Navbar gets a hairline + shadow once the page has scrolled
       --------------------------------------------------------------- */
    const navbar = document.querySelector('.navbar');

    if (navbar) {
        const syncNavbar = () => {
            navbar.classList.toggle('is-stuck', window.scrollY > 8);
        };

        syncNavbar();
        window.addEventListener('scroll', syncNavbar, { passive: true });
    }

    /* ---------------------------------------------------------------
       Highlight the nav link for the section currently in view
       --------------------------------------------------------------- */
    const navLinks = Array.from(document.querySelectorAll('.nav-links a'));
    const sections = navLinks
        .map((link) => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    if (sections.length && 'IntersectionObserver' in window) {
        const visible = new Map();

        const setActive = (id) => {
            navLinks.forEach((link) => {
                link.classList.toggle(
                    'is-active',
                    link.getAttribute('href') === `#${id}`
                );
            });
        };

        const sectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    visible.set(entry.target.id, entry.intersectionRatio);
                });

                // Whichever tracked section occupies the most of the viewport wins.
                let best = null;
                let bestRatio = 0;
                visible.forEach((ratio, id) => {
                    if (ratio > bestRatio) {
                        bestRatio = ratio;
                        best = id;
                    }
                });

                if (best) setActive(best);
            },
            {
                threshold: [0, 0.15, 0.35, 0.6, 0.85],
                rootMargin: '-84px 0px 0px 0px' // discount the fixed navbar
            }
        );

        sections.forEach((section) => sectionObserver.observe(section));
    }
});
