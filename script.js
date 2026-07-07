const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('active');
    menuToggle.classList.toggle('active');
    document.body.classList.toggle('menu-open', isOpen);
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        menuToggle.classList.remove('active');
        document.body.classList.remove('menu-open');
        menuToggle.setAttribute('aria-expanded', 'false');
    });
});

document.querySelectorAll('.before-after-slider').forEach(slider => {
    const control = slider.querySelector('.slider-control');
    const before = slider.querySelector('.before-image');
    const line = slider.querySelector('.slider-line');
    const handle = slider.querySelector('.slider-handle');

    const updateSlider = () => {
        const value = control.value;
        before.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
        line.style.left = value + '%';
        handle.style.left = value + '%';
    };

    control.addEventListener('input', updateSlider);
    updateSlider();
});

const revealItems = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if(entry.isIntersecting){
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

revealItems.forEach(item => revealObserver.observe(item));
