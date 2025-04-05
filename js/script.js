

document.addEventListener('DOMContentLoaded', function() {
    const slideshows = document.querySelectorAll('.image-slideshow');
    
    slideshows.forEach(slideshow => {
        const images = slideshow.querySelectorAll('img');
        let currentIndex = 0;
        
        // Set initial image
        images[currentIndex].classList.add('active');
        
        // Start with next image pre-loaded
        let nextIndex = (currentIndex + 1) % images.length;
        images[nextIndex].classList.add('preload');
        
        setInterval(() => {
            // Start fading out current image
            images[currentIndex].classList.remove('active');
            
            // Immediately start fading in next image
            images[nextIndex].classList.remove('preload');
            images[nextIndex].classList.add('active');
            
            // Update indices for next cycle
            currentIndex = nextIndex;
            nextIndex = (currentIndex + 1) % images.length;
            
            // Pre-load the next-next image
            images[nextIndex].classList.add('preload');
            
        }, 6000); // Total cycle time (6 seconds)
    });
    // Animate stats counting up
    const statNumbers = document.querySelectorAll('.stat-number');
    
    function animateStats() {
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-count'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;
            
            const counter = setInterval(() => {
                current += step;
                if (current >= target) {
                    clearInterval(counter);
                    current = target;
                }
                stat.textContent = Math.floor(current);
            }, 16);
            
            stat.classList.add('animated');
        });
    }
    
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.classList.contains('stats-grid')) {
                    animateStats();
                }
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Observe sections
    document.querySelectorAll('.results-overview, .student-journeys, .teaching-areas, .document-gallery').forEach(section => {
        observer.observe(section);
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});