document.addEventListener('DOMContentLoaded', function () {
    // Smooth scrolling for navigation links
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
                top: targetElement.offsetTop - 50,
                behavior: 'smooth',
            });
        }
    }

    // Highlight the current section in the navigation bar as you scroll
    window.addEventListener('scroll', () => {
        const fromTop = window.scrollY;
        navLinks.forEach(link => {
            const section = document.querySelector(link.hash);
            if (
                section.offsetTop <= fromTop + 50 &&
                section.offsetTop + section.offsetHeight > fromTop + 50
            ) {
                link.classList.add('active-link');
            } else {
                link.classList.remove('active-link');
            }
        });
    });

    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;

    darkModeToggle.addEventListener('click', function () {
        body.classList.toggle('dark-mode');
    });

    // Handling Form Submission
    const contactForm = document.querySelector('#contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(contactForm);
            
            // You can now handle form data, for example, by sending it to a server using the Fetch API.
            // Replace the following lines with your specific form submission logic:
            
            // Example: Sending form data to a server using Fetch API
            fetch('https://your-api-endpoint.com', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // Handle the response from the server
                console.log('Form submission successful:', data);
                // You can add code here to show a success message or redirect the user.
            })
            .catch(error => {
                console.error('Error submitting the form:', error);
                // Handle the error, e.g., display an error message to the user.
            });
        });
    }

    // Add more JavaScript functionality as needed for your specific requirements

    // Example: Adding an event listener to another element
    const exampleElement = document.getElementById('example-element');
    if (exampleElement) {
        exampleElement.addEventListener('click', function () {
            // Your code here
        });
    }
});
