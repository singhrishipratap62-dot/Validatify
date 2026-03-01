// ===========================
// VALIDATIFY — Scripts (Supabase-backed)
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    // =============================================
    // 1. ANIMATIONS — Always runs, no dependencies
    // =============================================
    const animatedEls = document.querySelectorAll('.animate-in');
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    animatedEls.forEach((el) => observer.observe(el));

    // =============================================
    // 2. SMOOTH SCROLL — Always runs
    // =============================================
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // =============================================
    // 3. NAV SCROLL EFFECT — Always runs
    // =============================================
    const nav = document.querySelector('.nav');
    if (nav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                nav.style.background = 'rgba(10, 10, 10, 0.92)';
            } else {
                nav.style.background = 'rgba(10, 10, 10, 0.7)';
            }
        });
    }

    // =============================================
    // 4. SUPABASE — Wrapped in try/catch, never
    //    crashes the rest of the page
    // =============================================
    const TOTAL_SPOTS = 100;
    let supabaseClient = null;

    try {
        if (typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_ANON_KEY !== 'undefined' && window.supabase) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } else {
            console.warn('Supabase config not found — form will work in offline/demo mode.');
        }
    } catch (err) {
        console.warn('Supabase init failed:', err.message);
    }

    // --- Counter ---
    async function fetchSpotsRemaining() {
        if (!supabaseClient) return TOTAL_SPOTS;
        try {
            const { count, error } = await supabaseClient
                .from('waitlist_signups')
                .select('*', { count: 'exact', head: true });
            if (error) {
                console.error('Counter fetch error:', error.message);
                return TOTAL_SPOTS;
            }
            return Math.max(0, TOTAL_SPOTS - (count || 0));
        } catch (err) {
            console.error('Counter fetch failed:', err);
            return TOTAL_SPOTS;
        }
    }

    function updateCounterDisplays(spots) {
        document.querySelectorAll('.counter-num').forEach((el) => {
            el.textContent = spots;
        });
        document.querySelectorAll('.counter').forEach((el) => {
            if (el.classList.contains('counter-num')) return;
            el.textContent = spots;
        });
    }

    // Load initial count (async, non-blocking)
    fetchSpotsRemaining().then(updateCounterDisplays);

    // --- Form Handling ---
    const form = document.getElementById('waitlist-form');
    const successMsg = document.getElementById('waitlist-success');
    const errorMsg = document.getElementById('waitlist-error');

    if (form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.textContent : 'Claim My Spot';

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = form.querySelector('#name').value.trim();
            const email = form.querySelector('#email').value.trim();
            const niche = form.querySelector('#niche').value.trim();

            // Reset error
            if (errorMsg) {
                errorMsg.classList.remove('show');
                errorMsg.textContent = '';
            }

            // Validate
            if (!name) {
                showError('Name is required.');
                return;
            }
            if (!email || !isValidEmail(email)) {
                showError('Please enter a valid email address.');
                return;
            }

            // If no Supabase, show success anyway (demo mode)
            if (!supabaseClient) {
                form.style.display = 'none';
                if (successMsg) successMsg.classList.add('show');
                return;
            }

            // Check spots
            const spots = await fetchSpotsRemaining();
            if (spots <= 0) {
                showError('All founding spots have been claimed! You can still join the general waitlist.');
            }

            // Loading state
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Joining...';
            }

            try {
                const { error } = await supabaseClient
                    .from('waitlist_signups')
                    .insert([{ name, email, niche: niche || '' }]);

                if (error) {
                    if (error.code === '23505' || error.message.includes('duplicate')) {
                        showError('This email is already on the waitlist!');
                    } else {
                        showError('Something went wrong. Please try again.');
                        console.error('Supabase insert error:', error);
                    }
                    return;
                }

                // Success
                const newSpots = await fetchSpotsRemaining();
                updateCounterDisplays(newSpots);
                form.style.display = 'none';
                if (successMsg) successMsg.classList.add('show');
            } catch (err) {
                showError('Network error. Please check your connection and try again.');
                console.error('Submit failed:', err);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            }
        });
    }

    function showError(msg) {
        if (errorMsg) {
            errorMsg.textContent = msg;
            errorMsg.classList.add('show');
        }
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
});
