// Profile Dropdown Functionality
document.addEventListener('DOMContentLoaded', function() {
    const profileDropdownContainer = document.querySelector('.profile-dropdown-container');
    const profileIconBtn = document.querySelector('.profile-icon-btn');
    const profileDropdownMenu = document.querySelector('.profile-dropdown-menu');
    
    if (profileIconBtn && profileDropdownMenu) {
        // Toggle dropdown on profile icon click
        profileIconBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdownMenu.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!profileDropdownContainer.contains(e.target)) {
                profileDropdownMenu.classList.remove('show');
            }
        });
        
        // Close dropdown when clicking on a menu item
        const dropdownItems = profileDropdownMenu.querySelectorAll('.profile-dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', function() {
                profileDropdownMenu.classList.remove('show');
            });
        });
    }
});













