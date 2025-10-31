document.addEventListener('DOMContentLoaded', function () {
    // Template gallery navigation
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const templatesContainer = document.querySelector('.templates-container');

    if (prevBtn && nextBtn && templatesContainer) {
        prevBtn.addEventListener('click', function () {
            templatesContainer.scrollBy({
                left: -200,
                behavior: 'smooth'
            });
        });

        nextBtn.addEventListener('click', function () {
            templatesContainer.scrollBy({
                left: 200,
                behavior: 'smooth'
            });
        });
    }

    // Template selection
    const templateItems = document.querySelectorAll('.template-item');
    templateItems.forEach(item => {
        item.addEventListener('click', function () {
            templateItems.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Field button interactions
    const fieldButtons = document.querySelectorAll('.field-btn');
    fieldButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            // Remove active class from all field buttons
            fieldButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
        });
    });

    // Block button interactions
    const blockButtons = document.querySelectorAll('.block-btn');
    blockButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            console.log('Block selected:', this.textContent.trim());
        });
    });

    // Add content button
    const addContentBtn = document.querySelector('.add-content-btn');
    if (addContentBtn) {
        addContentBtn.addEventListener('click', function () {
            console.log('Add content clicked');
        });
    }

    // Search functionality
    const searchInput = document.querySelector('.search-container input');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            console.log('Search:', this.value);
        });
    }

    // Menu button
    const menuBtn = document.querySelector('.menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', function () {
            console.log('Menu clicked');
        });
    }

    // Send button
    const sendBtn = document.querySelector('.send-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', function () {
            console.log('Send clicked');
        });
    }

    // Invite button
    const inviteBtn = document.querySelector('.invite-btn');
    if (inviteBtn) {
        inviteBtn.addEventListener('click', function () {
            console.log('Invite clicked');
        });
    }

    // Upload button
    const uploadBtn = document.querySelector('.upload-btn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function () {
            console.log('Upload clicked');
        });
    }

    // Add page button
    const addPageBtn = document.querySelector('.add-page-btn');
    if (addPageBtn) {
        addPageBtn.addEventListener('click', function () {
            console.log('Add page clicked');
        });
    }

    // Close button
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            console.log('Close clicked');
        });
    }

    // Handle responsive behavior
    function handleResize() {
        const rightSidebar = document.querySelector('.right-sidebar');
        const mainContent = document.querySelector('.main-content');

        if (window.innerWidth <= 768) {
            mainContent.style.flexDirection = 'column';
        } else {
            mainContent.style.flexDirection = 'row';
        }
    }

    window.addEventListener('resize', handleResize);
    handleResize(); // Call on initial load
});
