// ===== SIMPLE PAGE LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('John Sullivan · Jack of All Trades');
    console.log('Websites · Product Search · Customer Linking');
});

// ===== SMOOTH SCROLL FOR ANY ANCHOR LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// ===== BASIC SCROLL ANIMATION FOR SKILL CARDS =====
const skillCards = document.querySelectorAll('.skill-card');

function checkCards() {
    skillCards.forEach(function(card) {
        const rect = card.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight - 80;
        if (isVisible) {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }
    });
}

// Set initial state
skillCards.forEach(function(card) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
});

// Check on load and scroll
setTimeout(checkCards, 200);
window.addEventListener('scroll', checkCards);

// ===== SIMPLE COUNTER FOR FUN =====
// Just a little easter egg in the console
console.log('📊 Stats: 3 skills · 3 active projects · 1 Jack of All Trades');
