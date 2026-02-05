// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Project Filter Functionality
document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked button
            this.classList.add('active');

            // Get the category to filter
            const category = this.getAttribute('data-category');

            // Filter projects
            projectCards.forEach(card => {
                if (category === 'all') {
                    card.classList.remove('hide');
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 10);
                } else {
                    if (card.getAttribute('data-category') === category) {
                        card.classList.remove('hide');
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'scale(1)';
                        }, 10);
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.8)';
                        setTimeout(() => {
                            card.classList.add('hide');
                        }, 300);
                    }
                }
            });
        });
    });
});

// Hamburger menu toggle
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    // Close menu when clicking on a link
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });
}

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.project-card, .achievement-card, .timeline-item, .contact-card');

    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Add initial transition styles for project cards
document.addEventListener('DOMContentLoaded', () => {
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.style.transition = 'all 0.4s ease, opacity 0.3s ease, transform 0.3s ease';
    });
});

// Console easter egg
console.log('%c👋 Hey there, developer!', 'font-size: 20px; color: #9DB2BF; font-weight: bold; font-family: "Fira Code", monospace;');
console.log('%cLike what you see? Let\'s connect!', 'font-size: 14px; color: #526D82; font-family: "Fira Code", monospace;');
console.log('%cGitHub: https://github.com/Prashanna-Raj-Pandit', 'font-size: 12px; color: #DDE6ED; font-family: "Fira Code", monospace;');

// Lightbox Functions for Tableau Dashboards
function openLightbox(dashboardId) {
    const lightbox = document.getElementById('lightbox-' + dashboardId);
    if (lightbox) {
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
}

function closeLightbox(dashboardId) {
    const lightbox = document.getElementById('lightbox-' + dashboardId);
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto'; // Re-enable scrolling
    }
}

// Close lightbox when clicking outside the image
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('lightbox-modal')) {
        event.target.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// Close lightbox with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const activeLightbox = document.querySelector('.lightbox-modal.active');
        if (activeLightbox) {
            activeLightbox.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
});

// ========================================
// EXPERIENCE SECTION TOGGLE FUNCTIONALITY
// ========================================

/**
 * Toggle experience details expand/collapse
 * @param {string} detailsId - ID of the details container
 * @param {HTMLElement} button - The button element that was clicked
 */
function toggleExperience(detailsId, button) {
    const details = document.getElementById(detailsId);
    const buttonText = button.querySelector('span');

    if (details.classList.contains('expanded')) {
        // Collapse
        details.classList.remove('expanded');
        button.classList.remove('expanded');
        buttonText.textContent = 'See more';
    } else {
        // Expand
        details.classList.add('expanded');
        button.classList.add('expanded');
        buttonText.textContent = 'See less';
    }
}

// Optional: Expand all experiences
function expandAllExperiences() {
    const allDetails = document.querySelectorAll('.exp-details');
    const allButtons = document.querySelectorAll('.exp-toggle-btn');

    allDetails.forEach(detail => detail.classList.add('expanded'));
    allButtons.forEach(button => {
        button.classList.add('expanded');
        button.querySelector('span').textContent = 'See less';
    });
}

// Optional: Collapse all experiences
function collapseAllExperiences() {
    const allDetails = document.querySelectorAll('.exp-details');
    const allButtons = document.querySelectorAll('.exp-toggle-btn');

    allDetails.forEach(detail => detail.classList.remove('expanded'));
    allButtons.forEach(button => {
        button.classList.remove('expanded');
        button.querySelector('span').textContent = 'See more';
    });
}

// Add this to your existing script.js file or include it separately