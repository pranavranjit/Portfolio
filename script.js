document.addEventListener('DOMContentLoaded', () => {
    const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

    const navbar = document.querySelector('.navbar');
    const strip = document.querySelector('.nav-links');
    if (!navbar || !strip) return;

    const navLinks = Array.from(strip.querySelectorAll('a'));
    const sections = navLinks
        .map((link) => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    /* ---------------------------------------------------------------
       Navbar gets a hairline + shadow once the page has scrolled
       --------------------------------------------------------------- */
    const syncNavbar = () => {
        navbar.classList.toggle('is-stuck', window.scrollY > 8);
    };

    /* ---------------------------------------------------------------
       On narrow screens the links scroll sideways; fade the edge that
       still has links beyond it
       --------------------------------------------------------------- */
    const syncStrip = () => {
        const overflow = strip.scrollWidth - strip.clientWidth;
        strip.classList.toggle(
            'can-scroll-left',
            overflow > 1 && strip.scrollLeft > 1
        );
        strip.classList.toggle(
            'can-scroll-right',
            overflow > 1 && strip.scrollLeft < overflow - 1
        );
    };

    /* ---------------------------------------------------------------
       Highlight the link for the section being read, and keep it in
       view when the links are a scrolling strip
       --------------------------------------------------------------- */
    let current = null;

    const setActive = (id) => {
        if (id === current) return;
        const first = current === null;
        current = id;

        let activeLink = null;
        navLinks.forEach((link) => {
            const isActive = link.getAttribute('href') === `#${id}`;
            link.classList.toggle('is-active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'location');
                activeLink = link;
            } else {
                link.removeAttribute('aria-current');
            }
        });

        if (activeLink && strip.scrollWidth > strip.clientWidth) {
            const stripBox = strip.getBoundingClientRect();
            const linkBox = activeLink.getBoundingClientRect();
            strip.scrollBy({
                left:
                    linkBox.left -
                    stripBox.left -
                    (stripBox.width - linkBox.width) / 2,
                behavior: first || reduceMotion ? 'auto' : 'smooth'
            });
        }
    };

    // The active section is the last one whose top has crossed a reading
    // line a quarter of the way down the visible page, below the fixed nav.
    const spy = () => {
        if (!sections.length) return;
        const navHeight = navbar.offsetHeight;
        const line = navHeight + (window.innerHeight - navHeight) * 0.25;

        let active = sections[0];
        sections.forEach((section) => {
            if (section.getBoundingClientRect().top <= line) active = section;
        });

        // Short closing sections never reach the line; the page end is theirs.
        const atBottom =
            window.innerHeight + window.scrollY >=
            document.documentElement.scrollHeight - 2;
        if (atBottom) active = sections[sections.length - 1];

        setActive(active.id);
    };

    let queued = false;
    const onScroll = () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
            queued = false;
            syncNavbar();
            spy();
        });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
        syncStrip();
        onScroll();
    });
    strip.addEventListener('scroll', syncStrip, { passive: true });

    syncNavbar();
    syncStrip();
    spy();
});
