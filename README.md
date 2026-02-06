# Looping Log

**Looping Log** is a net-art installation that visualizes the psychological disintegration of the individual within a performance-driven society. 

![Project Status](https://img.shields.io/badge/Status-Experimental-orange)
![Tech Stack](https://img.shields.io/badge/Tech-HTML%20%7C%20CSS%20%7C%20JS-blue)

## 📖 Overview

Grounded in Ritzer's theory of **"McDonaldization,"** the project critiques how the relentless pursuit of efficiency and calculability transforms human life into a mechanized loop, leading to a state of chronic burnout.

The work simulates a ubiquitous digital workspace—resembling standard interfaces like Notion, Email, Word, or ChatGPT—where the user is invited to perform daily labor. However, as the user types, the system intervenes. A **"Ghost Text"** algorithm injects intrusive, disciplinary language into the screen, symbolizing the internalized social pressure that haunts our subconscious.

## ✨ Features

-   **Simulated Workspaces**: Faithful recreations of common productivity tools (Notion, Gmail, Figma, ChatGPT, etc.) that serve as the stage for digital labor.
-   **"Ghost Text" Algorithm**: An automated system that interrupts user input with phrases of pressure and anxiety (e.g., "The deadline is closed", "I have to finish this").
-   **The Infinite Loop**: A deceptive **'Exit'** button sits in the top right corner, promising respite but merely redirecting the participant to a new task. This navigation system traps users in a Sisyphean loop of endless labor, making escape impossible.
-   **System Crash**: Probability dictates that the loop eventually leads to a glitch or a simulated 503 error. This digital crash signifies a psychological breakdown where the burden of productivity renders the 'user' unable to continue, eventually resetting the cycle.

## 🛠 Technical Implementation

The project is built using vanilla web technologies:

-   **HTML5**: Structure for the various simulated interface pages (`pages/`).
-   **CSS3**: Styling for the interfaces and the visual decay effects (`common.css`).
-   **JavaScript**: Core logic for the "Ghost Text" injection, input handling, and the probabilistic "Exit" button behavior (`common.js`).

### Project Structure
```
Looping-LOG--The-Simulated-Studio/
├── backgrounds/      # Background images for simulated interfaces
├── pages/            # HTML files for each interface (Notion, Email, etc.)
├── common.css        # Shared styles
├── common.js         # Shared logic (Ghost Text, Navigation)
└── README.md         # Project documentation
```

## 🚀 Usage

1.  Clone or download the repository.
2.  Open any HTML file in the `pages/` directory (e.g., `pages/1notion.html`) in a modern web browser.
3.  Interact with the input fields to experience the "Ghost Text" intervention.
4.  Try to click "Exit" to escape the workspace.

## 📄 License

This project is an artistic work and is open for educational and non-commercial use.

---
*Created as part of a Net Art portfolio exploring themes of digital labor and psychological burnout.*
