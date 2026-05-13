document.addEventListener('DOMContentLoaded', () => {
    // Scroll Animation using Intersection Observer
    const animatedElements = document.querySelectorAll('.fade-in, .slide-up');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.2
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => {
        observer.observe(el);
    });

    // Particle Star Background (Simple Implementation)
    function createStars(elementId, count, size) {
        const starContainer = document.getElementById(elementId);
        if(!starContainer) return;
        
        let boxShadow = '';
        for(let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * 2000);
            const y = Math.floor(Math.random() * 2000);
            boxShadow += `${x}px ${y}px #FFF, `;
        }
        
        // Remove trailing comma and space
        boxShadow = boxShadow.slice(0, -2);
        
        const style = document.createElement('style');
        style.innerHTML = `
            #${elementId} {
                width: ${size}px;
                height: ${size}px;
                background: transparent;
                box-shadow: ${boxShadow};
                animation: animStar ${size === 1 ? '50s' : size === 2 ? '100s' : '150s'} linear infinite;
            }
            #${elementId}:after {
                content: " ";
                position: absolute;
                top: 2000px;
                width: ${size}px;
                height: ${size}px;
                background: transparent;
                box-shadow: ${boxShadow};
            }
            @keyframes animStar {
                from { transform: translateY(0px) }
                to { transform: translateY(-2000px) }
            }
        `;
        document.head.appendChild(style);
    }

    createStars('stars', 700, 1);
    createStars('stars2', 200, 2);
    createStars('stars3', 100, 3);

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
