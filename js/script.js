/**
 * OrganicOrNot – Main Script
 * Developed by J. Sullivan
 *
 * Features:
 * - Animated score bar on load
 * - Smooth scroll for navigation links
 * - Console greeting (scraper-friendly)
 */

(function() {
    'use strict';

    // --- Console Greeting (for developers/scrapers) ---
    console.log('OrganicOrNot — Viral Authenticity Intelligence');
    console.log('Developed by J. Sullivan');
    console.log('Data sourced from public APIs. Scores are estimates.');
    console.log('For inquiries: hello@organicornot.com');

    // --- Smooth scroll for internal links ---
    document.querySelectorAll('a[href^="#"]').forEach(function(link) {
        link.addEventListener('click', function(e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;
            var target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // --- Animate score bar on page load ---
    function animateScoreBar() {
        var bar = document.getElementById('scoreBar');
        var valueDisplay = document.getElementById('scoreValue');
        if (!bar || !valueDisplay) return;

        var targetWidth = 22; // percentage
        var current = 0;
        var step = 1;
        var interval = 16; // ms

        var timer = setInterval(function() {
            current += step;
            if (current >= targetWidth) {
                current = targetWidth;
                clearInterval(timer);
            }
            bar.style.width = current + '%';
            valueDisplay.textContent = Math.round(current);
        }, interval);
    }

    // Run after a short delay to ensure layout is ready
    setTimeout(animateScoreBar, 300);

    // --- Stat counter animation (simple) ---
    function animateStats() {
        var statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(function(el) {
            var text = el.textContent.trim();
            // Only animate if it contains a number (skip '3' which is fine)
            var match = text.match(/^([\d,]+)/);
            if (!match) return;
            var target = parseInt(match[1].replace(/,/g, ''), 10);
            if (isNaN(target)) return;

            var suffix = text.replace(/^[\d,]+/, '');
            var current = 0;
            var step = Math.max(1, Math.floor(target / 30));
            var timer = setInterval(function() {
                current += step;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                el.textContent = current.toLocaleString() + suffix;
            }, 30);
        });
    }

    // Run stats animation when element is visible (simple timeout)
    setTimeout(animateStats, 500);

    // --- Footer year update ---
    var yearEl = document.querySelector('.footer-copy');
    if (yearEl) {
        var year = new Date().getFullYear();
        yearEl.innerHTML = yearEl.innerHTML.replace('2026', year);
    }

})();
