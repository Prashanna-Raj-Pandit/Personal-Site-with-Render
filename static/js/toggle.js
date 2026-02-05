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