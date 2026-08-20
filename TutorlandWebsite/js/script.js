// ===== IMAGE SLIDESHOW =====
document.addEventListener('DOMContentLoaded', function() {
    // Get all slideshow containers
    const slideshows = document.querySelectorAll('.image-slideshow');
    
    slideshows.forEach(function(slideshow) {
        const images = slideshow.querySelectorAll('img');
        let currentIndex = 0;
        
        // Start with first image active
        images.forEach((img, index) => {
            if (index === 0) {
                img.classList.add('active');
            } else {
                img.classList.remove('active');
            }
        });
        
        // Change image every 4 seconds
        setInterval(function() {
            // Remove active class from current
            images[currentIndex].classList.remove('active');
            
            // Move to next
            currentIndex = (currentIndex + 1) % images.length;
            
            // Add active class to new current
            images[currentIndex].classList.add('active');
        }, 4000);
    });
});

// ===== STATS COUNTER ANIMATION =====
document.addEventListener('DOMContentLoaded', function() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    // Function to check if element is in viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    // Function to animate counter
    function animateCounter(element) {
        const target = element.getAttribute('data-count');
        const isPercentage = target.includes('%');
        const cleanTarget = parseInt(target.replace('%', ''));
        const duration = 2000;
        const startTime = performance.now();
        
        // Store original text for suffix
        const suffix = isPercentage ? '%' : '';
        
        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * cleanTarget);
            
            element.textContent = current + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        }
        
        requestAnimationFrame(updateCounter);
    }
    
    // Check stats on scroll
    let animated = false;
    
    function checkStats() {
        if (animated) return;
        
        statNumbers.forEach(function(stat) {
            if (isInViewport(stat) && !stat.classList.contains('animated')) {
                stat.classList.add('animated');
                animateCounter(stat);
                animated = true;
            }
        });
    }
    
    // Initial check
    setTimeout(checkStats, 500);
    
    // Check on scroll
    window.addEventListener('scroll', function() {
        if (!animated) {
            checkStats();
        }
    });
});

// ===== SMOOTH SCROLL FOR NAVIGATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scroll for any anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// ===== PARALLAX FLOATING ICONS =====
document.addEventListener('DOMContentLoaded', function() {
    const floatingIcons = document.querySelectorAll('.floating-icon');
    
    window.addEventListener('scroll', function() {
        const scrollY = window.scrollY;
        floatingIcons.forEach(function(icon, index) {
            const speed = 0.02 + (index * 0.01);
            const yPos = scrollY * speed;
            icon.style.transform = `translateY(${yPos}px)`;
        });
    });
});

// ===== HERO SCROLL INDICATOR HIDE =====
document.addEventListener('DOMContentLoaded', function() {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    
    window.addEventListener('scroll', function() {
        const scrollY = window.scrollY;
        if (scrollY > 100) {
            scrollIndicator.style.opacity = '0';
            scrollIndicator.style.transition = 'opacity 0.5s ease';
        } else {
            scrollIndicator.style.opacity = '0.7';
        }
    });
});

console.log('Teacher Toey website loaded successfully!');