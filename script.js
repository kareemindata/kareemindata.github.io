document.addEventListener('DOMContentLoaded', function () {
    // Handle smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.navigation a');
    navLinks.forEach(link => {
        link.addEventListener('click', smoothScroll);
    });

    // Function to scroll smoothly to a target element
    function smoothScroll(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 50, // Adjust the offset as needed
                behavior: 'smooth',
            });
        }
    }

    // Add animations to elements as they come into view
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    window.addEventListener('scroll', checkElementsInView);

    function checkElementsInView() {
        animatedElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            if (elementTop < window.innerHeight - 100) {
                element.classList.add('animate');
            }
        });
    }

    // Example: Toggle a class on button click
    const toggleButton = document.querySelector('.toggle-button');
    const toggleElement = document.querySelector('.toggle-element');
    
    toggleButton.addEventListener('click', function () {
        toggleElement.classList.toggle('active');
    });

    // Example: Form submission handling
    const contactForm = document.querySelector('#contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            // Handle form submission logic here
            // You can use Fetch API or other methods to send form data to a server
        });
    }

    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;
    
    darkModeToggle.addEventListener('click', function () {
        body.classList.toggle('dark-mode');
    });

        // Rest of the JavaScript code remains the same

    // Example: Handling Form Submission
    const contactForm = document.querySelector('#contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(contactForm);
            // You can now handle form data, for example, by sending it to a server using the Fetch API.
            // Replace the following lines with your specific form submission logic:
            console.log('Form submitted with the following data:');
            for (let [name, value] of formData) {
                console.log(`${name}: ${value}`);
            }
        });
    }

    // Add more JavaScript functionality as needed for your specific requirements
});

