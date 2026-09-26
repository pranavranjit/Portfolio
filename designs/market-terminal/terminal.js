(() => {
    const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

    const strip = document.querySelector('.strip');
    const keys = document.querySelector('.keys');
    if (!strip || !keys) return;

    const links = Array.from(keys.querySelectorAll('a'));
    const sections = links
        .map((link) => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    /* ---------------------------------------------------------------
       Solid means committed: fill the key for the section being read
       and keep it in view when the keys scroll sideways
       --------------------------------------------------------------- */
    let current = null;

    const setActive = (id) => {
        if (id === current) return;
        const first = current === null;
        current = id;

        let activeLink = null;
        links.forEach((link) => {
            const isActive = link.getAttribute('href') === `#${id}`;
            link.classList.toggle('is-active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'location');
                activeLink = link;
            } else {
                link.removeAttribute('aria-current');
            }
        });

        if (activeLink && keys.scrollWidth > keys.clientWidth) {
            const keysBox = keys.getBoundingClientRect();
            const linkBox = activeLink.getBoundingClientRect();
            keys.scrollBy({
                left:
                    linkBox.left -
                    keysBox.left -
                    (keysBox.width - linkBox.width) / 2,
                behavior: first || reduceMotion ? 'auto' : 'smooth'
            });
        }
    };

    // The last section whose top has crossed a reading line a quarter of the
    // way down the visible page wins; the page end belongs to the last one.
    const spy = () => {
        if (!sections.length) return;
        const stripHeight = strip.offsetHeight;
        const line = stripHeight + (window.innerHeight - stripHeight) * 0.25;

        let active = sections[0];
        sections.forEach((section) => {
            if (section.getBoundingClientRect().top <= line) active = section;
        });

        const atBottom =
            window.innerHeight + window.scrollY >=
            document.documentElement.scrollHeight - 2;
        if (atBottom) active = sections[sections.length - 1];

        setActive(active.id);
    };

    // When the keys scroll sideways, fade whichever edge has keys beyond it.
    const syncKeys = () => {
        const overflow = keys.scrollWidth - keys.clientWidth;
        keys.classList.toggle('can-scroll-left', overflow > 1 && keys.scrollLeft > 1);
        keys.classList.toggle(
            'can-scroll-right',
            overflow > 1 && keys.scrollLeft < overflow - 1
        );
    };

    let queued = false;
    const onScroll = () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
            queued = false;
            spy();
        });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
        syncKeys();
        onScroll();
    });
    keys.addEventListener('scroll', syncKeys, { passive: true });
    syncKeys();
    spy();

    /* ---------------------------------------------------------------
       Keyed navigation: 1 to 5 jump to sections 01 to 05
       --------------------------------------------------------------- */
    const byKey = {
        1: '#experience',
        2: '#projects',
        3: '#education',
        4: '#about',
        5: '#contact'
    };

    document.addEventListener('keydown', (event) => {
        if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }
        const target = event.target;
        if (
            target.isContentEditable ||
            /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
        ) {
            return;
        }

        const section = byKey[event.key] && document.querySelector(byKey[event.key]);
        if (!section) return;

        event.preventDefault();
        section.scrollIntoView({
            behavior: reduceMotion ? 'auto' : 'smooth',
            block: 'start'
        });

        // Move focus with the view so the next Tab continues from here.
        const heading = section.querySelector('h2');
        if (heading) {
            heading.setAttribute('tabindex', '-1');
            heading.focus({ preventScroll: true });
        }
    });

    /* ---------------------------------------------------------------
       One living surface: the points arrive left to right and the
       least-squares fit and its ±1 SE band recompute with each one.
       Without JavaScript, or with reduced motion, the finished chart
       is what shows.
       --------------------------------------------------------------- */
    const figure = document.querySelector('.fit');
    const plot = figure && figure.querySelector('.plot');
    if (!plot || reduceMotion) return;

    const fitLine = plot.querySelector('.plot-fit');
    const band = plot.querySelector('.plot-band');
    const points = Array.from(plot.querySelectorAll('.plot-dots circle'))
        .map((el) => ({
            el,
            x: parseFloat(el.getAttribute('cx')),
            y: parseFloat(el.getAttribute('cy'))
        }))
        .sort((a, b) => a.x - b.x);
    if (!fitLine || !band || points.length < 3) return;

    const X0 = 60;
    const X1 = 400;

    const refit = (n) => {
        const seen = points.slice(0, n);
        const mx = seen.reduce((s, p) => s + p.x, 0) / n;
        const my = seen.reduce((s, p) => s + p.y, 0) / n;
        let sxx = 0;
        let sxy = 0;
        seen.forEach((p) => {
            sxx += (p.x - mx) ** 2;
            sxy += (p.x - mx) * (p.y - my);
        });
        const slope = sxy / sxx;
        const at = (x) => my + slope * (x - mx);

        fitLine.setAttribute(
            'd',
            `M ${X0} ${at(X0).toFixed(1)} L ${X1} ${at(X1).toFixed(1)}`
        );
        fitLine.classList.add('on');

        if (n >= 3) {
            const sse = seen.reduce((s, p) => s + (p.y - at(p.x)) ** 2, 0);
            const se = Math.sqrt(sse / (n - 2));
            band.setAttribute(
                'd',
                `M ${X0} ${(at(X0) - se).toFixed(1)} L ${X1} ${(at(X1) - se).toFixed(1)} ` +
                    `L ${X1} ${(at(X1) + se).toFixed(1)} L ${X0} ${(at(X0) + se).toFixed(1)} Z`
            );
            band.classList.add('on');
        }
    };

    figure.classList.add('is-live');

    let n = 0;
    const STEP = 110;
    const arrive = () => {
        points[n].el.classList.add('on');
        n += 1;
        if (n >= 2) refit(n);
        if (n < points.length) window.setTimeout(arrive, STEP);
    };

    window.setTimeout(arrive, 450);
})();
