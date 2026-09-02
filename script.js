const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
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
}

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
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

revealItems.forEach(item => revealObserver.observe(item));


/* ONLINE BOOKING */

const BOOKING_API = 'https://dzqmyuhrsvexjkeckmwa.supabase.co/functions/v1/booking-api';

const bookingForm = document.querySelector('#booking-form');

if (bookingForm) {
    const mainServicesEl = document.querySelector('#booking-main-services');
    const addonServicesEl = document.querySelector('#booking-addon-services');
    const dateEl = document.querySelector('#booking-date');
    const timeEl = document.querySelector('#booking-time');
    const timesEl = document.querySelector('#booking-times');
    const durationEl = document.querySelector('#booking-duration');
    const totalEl = document.querySelector('#booking-total');
    const countEl = document.querySelector('#booking-service-count');
    const submitEl = document.querySelector('#booking-submit');
    const submitSummaryEl = document.querySelector('#booking-submit-summary');
    const statusEl = document.querySelector('#booking-status');

    let services = [];
    let selectedTime = '';
    let availabilityRequestId = 0;

    const money = value => `${Number(value).toFixed(0)} €`;

    const durationLabel = minutes => {
        const n = Number(minutes);
        if (n < 60) return `${n} min`;
        const hours = Math.floor(n / 60);
        const mins = n % 60;
        return mins ? `${hours} h ${mins} min` : `${hours} h`;
    };

    const currentVehicleType = () =>
        bookingForm.querySelector('input[name="vehicle-type"]:checked')?.value || 'soiduauto';

    const selectedSlugs = () =>
        [...bookingForm.querySelectorAll('.booking-service input:checked')].map(input => input.value);

    const selectedServices = () => {
        const selected = new Set(selectedSlugs());
        return services.filter(service => selected.has(service.slug));
    };

    const servicePrice = service => {
        if (service.fixed_price !== null && service.fixed_price !== undefined) {
            return Number(service.fixed_price);
        }
        return currentVehicleType() === 'maastur'
            ? Number(service.suv_price)
            : Number(service.car_price);
    };

    const setStatus = (message = '', type = '') => {
        statusEl.textContent = message;
        statusEl.className = 'booking-status';
        if (message) {
            statusEl.classList.add('show');
            if (type) statusEl.classList.add(type);
        }
    };

    const api = async payload => {
        const response = await fetch(BOOKING_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error('Serverilt tuli vigane vastus.');
        }

        if (!response.ok) {
            const error = new Error(data.error || 'Broneerimissüsteemi viga.');
            error.status = response.status;
            throw error;
        }

        return data;
    };

    const priceText = service => {
        if (service.fixed_price !== null && service.fixed_price !== undefined) {
            return money(service.fixed_price);
        }
        const price = currentVehicleType() === 'maastur'
            ? service.suv_price
            : service.car_price;
        return money(price);
    };

    const serviceCard = service => `
        <label class="booking-service">
            <input type="checkbox" value="${service.slug}">
            <span class="booking-service-body">
                <span class="booking-service-top">
                    <span class="booking-service-name">${service.name}</span>
                    <span class="booking-check">✓</span>
                </span>
                <span class="booking-service-meta">
                    <span>${durationLabel(service.duration_minutes)}</span>
                    <strong class="booking-service-price" data-price-slug="${service.slug}">${priceText(service)}</strong>
                </span>
            </span>
        </label>
    `;

    const renderServices = () => {
        const bookable = services.filter(service => service.online_bookable);
        const primary = bookable.filter(service => !service.is_addon);
        const addons = bookable.filter(service => service.is_addon);

        mainServicesEl.innerHTML = primary.map(serviceCard).join('');
        addonServicesEl.innerHTML = addons.map(serviceCard).join('');

        bookingForm.querySelectorAll('.booking-service input').forEach(input => {
            input.addEventListener('change', handleSelectionChange);
        });
    };

    const updateDisplayedPrices = () => {
        services.forEach(service => {
            const price = bookingForm.querySelector(`[data-price-slug="${service.slug}"]`);
            if (price) price.textContent = priceText(service);
        });
    };

    const updateSummary = () => {
        const selected = selectedServices();
        const totalPrice = selected.reduce((sum, service) => sum + servicePrice(service), 0);
        const totalDuration = selected.reduce((sum, service) => sum + Number(service.duration_minutes), 0);

        countEl.textContent = String(selected.length);
        durationEl.textContent = selected.length ? durationLabel(totalDuration) : '—';
        totalEl.textContent = selected.length ? money(totalPrice) : '—';

        if (selected.length && dateEl.value && selectedTime) {
            submitSummaryEl.textContent =
                `${dateEl.value.split('-').reverse().join('.')} kell ${selectedTime} • ${money(totalPrice)} • ${durationLabel(totalDuration)}`;
        } else if (selected.length) {
            submitSummaryEl.textContent = 'Vali kuupäev ja vaba kellaaeg.';
        } else {
            submitSummaryEl.textContent = 'Vali teenus ja aeg.';
        }

        submitEl.disabled = !(selected.length && dateEl.value && selectedTime);
    };

    const resetTime = () => {
        selectedTime = '';
        timeEl.value = '';
        timesEl.innerHTML = '<p class="booking-hint">Vali kuupäev, et näha vabu aegu.</p>';
        updateSummary();
    };

    const handleSelectionChange = async event => {
        if (event?.target?.value === 'lemmikloomakarvad' && event.target.checked) {
            const otherSelected = selectedSlugs().some(slug => slug !== 'lemmikloomakarvad');
            if (!otherSelected) {
                event.target.checked = false;
                setStatus('Lemmikloomakarvade eemaldus on ainult lisateenus. Vali kõigepealt mõni muu teenus.', 'error');
            } else {
                setStatus();
            }
        } else {
            setStatus();
        }

        resetTime();
        updateSummary();
        if (dateEl.value && selectedSlugs().length) await loadAvailability();
    };

    const loadAvailability = async () => {
        const slugs = selectedSlugs();

        if (!slugs.length || !dateEl.value) {
            resetTime();
            return;
        }

        const requestId = ++availabilityRequestId;
        selectedTime = '';
        timeEl.value = '';
        timesEl.innerHTML = '<p class="booking-hint">Vabade aegade laadimine…</p>';
        submitEl.disabled = true;

        try {
            const result = await api({
                action: 'availability',
                date: dateEl.value,
                vehicleType: currentVehicleType(),
                serviceSlugs: slugs
            });

            if (requestId !== availabilityRequestId) return;

            durationEl.textContent = result.durationLabel;
            totalEl.textContent = money(result.totalPrice);

            if (!result.slots.length) {
                timesEl.innerHTML = '<p class="booking-hint">Sellel päeval ei ole valitud töö jaoks sobivat vaba aega. Vali teine kuupäev.</p>';
                updateSummary();
                return;
            }

            timesEl.innerHTML = result.slots
                .map(time => `<button type="button" class="booking-time-btn" data-time="${time}">${time}</button>`)
                .join('');

            timesEl.querySelectorAll('.booking-time-btn').forEach(button => {
                button.addEventListener('click', () => {
                    timesEl.querySelectorAll('.booking-time-btn').forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    selectedTime = button.dataset.time;
                    timeEl.value = selectedTime;
                    setStatus();
                    updateSummary();
                });
            });

            updateSummary();
        } catch (error) {
            if (requestId !== availabilityRequestId) return;
            timesEl.innerHTML = `<p class="booking-hint">${error.message}</p>`;
            updateSummary();
        }
    };

    const tallinnToday = () => {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Europe/Tallinn',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).formatToParts(new Date());

        const map = Object.fromEntries(
            parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value])
        );
        return `${map.year}-${map.month}-${map.day}`;
    };

    const addDays = (dateString, days) => {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day + days));
        return [
            date.getUTCFullYear(),
            String(date.getUTCMonth() + 1).padStart(2, '0'),
            String(date.getUTCDate()).padStart(2, '0')
        ].join('-');
    };

    const configureDateLimits = () => {
        const today = tallinnToday();
        dateEl.min = today;
        dateEl.max = addDays(today, 60);
    };

    bookingForm.querySelectorAll('input[name="vehicle-type"]').forEach(input => {
        input.addEventListener('change', async () => {
            updateDisplayedPrices();
            resetTime();
            updateSummary();
            if (dateEl.value && selectedSlugs().length) await loadAvailability();
        });
    });

    dateEl.addEventListener('change', () => {
        selectedTime = '';
        timeEl.value = '';
        setStatus();
        loadAvailability();
    });

    bookingForm.addEventListener('submit', async event => {
        event.preventDefault();

        if (!selectedSlugs().length) {
            setStatus('Vali vähemalt üks teenus.', 'error');
            return;
        }

        if (!dateEl.value || !selectedTime) {
            setStatus('Vali kuupäev ja vaba kellaaeg.', 'error');
            return;
        }

        const name = document.querySelector('#booking-name').value.trim();
        const phone = document.querySelector('#booking-phone').value.trim();
        const email = document.querySelector('#booking-email').value.trim();

        if (name.length < 2 || phone.length < 5) {
            setStatus('Sisesta palun nimi ja telefoninumber.', 'error');
            return;
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setStatus('Sisesta korrektne e-posti aadress, et saaksime saata broneeringu kinnituse.', 'error');
            return;
        }

        submitEl.disabled = true;
        submitEl.textContent = 'Kinnitan…';
        setStatus('Broneeringu kinnitamine…', 'loading');

        try {
            const result = await api({
                action: 'create',
                date: dateEl.value,
                time: selectedTime,
                vehicleType: currentVehicleType(),
                serviceSlugs: selectedSlugs(),
                website: document.querySelector('#booking-website').value,
                customer: {
                    name,
                    phone,
                    email,
                    vehicleMakeModel: document.querySelector('#booking-vehicle').value.trim(),
                    registrationNumber: document.querySelector('#booking-registration').value.trim(),
                    notes: document.querySelector('#booking-notes').value.trim()
                }
            });

            setStatus(
                `Broneering kinnitatud! ${dateEl.value.split('-').reverse().join('.')} kell ${selectedTime}. ` +
                `Kokku ${money(result.totalPrice)}, eeldatav kestus ${result.durationLabel}.`,
                'success'
            );

            bookingForm.querySelectorAll('.booking-service input').forEach(input => {
                input.checked = false;
            });

            document.querySelector('#booking-name').value = '';
            document.querySelector('#booking-phone').value = '';
            document.querySelector('#booking-email').value = '';
            document.querySelector('#booking-vehicle').value = '';
            document.querySelector('#booking-registration').value = '';
            document.querySelector('#booking-notes').value = '';
            dateEl.value = '';
            selectedTime = '';
            timeEl.value = '';
            timesEl.innerHTML = '<p class="booking-hint">Vali esmalt vähemalt üks teenus ja kuupäev.</p>';
            updateSummary();
        } catch (error) {
            setStatus(error.message, 'error');

            if (error.status === 409) {
                await loadAvailability();
            }
        } finally {
            submitEl.textContent = 'Kinnita broneering';
            updateSummary();
        }
    });

    const initBooking = async () => {
        configureDateLimits();

        try {
            const result = await api({ action: 'services' });
            services = result.services || [];
            renderServices();
            updateDisplayedPrices();
            updateSummary();
        } catch (error) {
            mainServicesEl.innerHTML = `<div class="booking-loading">${error.message}</div>`;
            addonServicesEl.innerHTML = '';
            setStatus('Broneerimissüsteemi teenuseid ei õnnestunud laadida. Proovi lehte värskendada.', 'error');
        }
    };

    initBooking();
}
