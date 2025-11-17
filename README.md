# Seesaw Physics Simulation

This project is an interactive seesaw simulation where real world physics rules with precise trigonometic calculations were implemented to simulate seasaw motions realistically. It was built using pure JavaScript, HTML, and CSS. Utilization of multi-threading logic is an important feauture in the project, that enhances the realistic demonstraitions.

**Live Demo:** **https://plokoon68.github.io/seasaw-simulation-mehmet-ors/**

---

## Project Summary

This is a simulation where users can drop randomly weighted circle objects onto a seesaw by clicking on the canvas block. With each new object falling on the seasaw plank, the seesaw tilts and seeks balance based on realistic physics principles like Net Torque, Angular Acceleration, and Moment of Inertia. The project aims to demonstrate my skills implementing real-world physics rules in javascript, DOM manipulation, event handling, utilizing javascripts Web Workers for multi-thread like working, real-time animation, and ability to structurize the page elements in a responsive way using html-css.

## Features

- **Realistic Physics Engine:** A dynamic and smooth tilting animation based on calculations of Torque and Moment of Inertia.
- **Interactive Interface:** Users can drop balls with random weights (1-10 kg) anywhere on the seesaw plank.
- **Real-time Data Indicators:** Set of indicators displaying instantaneous data such as angle, angular velocity, angular acceleration, and the total weight/torque on both left and right side of the seasaw.
- **Logs Panel:** A log list that records the weight and position of each dropped ball.
- **State Management:**
  - **Pause/Continue:** The ability to pause the simulation at any moment and resume it from where it left off.
  - **Reset:** A button to reset the simulation to its initial state.
  - **Local Storage:** Persistent memory that allows the simulation to continue from it was left even after the page is refreshed or closed.
  - **Visual Distance Ruler:** A dynamic ruler indicating the distance from the pivot point.
  - **Dynamic Sound Effects:** Audio effects that generates sound when a weight falls on the plank, its intensity being proportionate to the weight (larger weight generates louder sound when it lands).

## Architecture

The project was developed without any external libraries or frameworks, using only **(Vanilla) JavaScript, HTML, and CSS**.

- **Rendering:** The **HTML `<canvas>` API** was used for all drawing and animation tasks.
- **Multi Threading:** **Web Workers** were used to generate seperate threads of each moving object (the weight that are falling and the seasaw rotating), handling their relevant complex physics calculations, enabling a smooth and non-blocking system.
---

## 🏗️ Architectural and Design Decisions (Thought Process)

The main goal was to build a modular, scalable, and maintainable application structure.

### 1. Modular File Structure

Abiding the Separation of Concerns and High Cohesion principles, the codebase was split into multiple files. This structure makes th code readable and allows each module to contain only its relevant functionalities.

-   **`main.js`**: The main entry point of the application. It initializes event listeners and acts as an orchestrator between other modules.
-   **`drawing.js`**: Responsible for all `<canvas>` drawing operations (e.g., `pdrawBall`, `pDrawSeesaw`).
-   **`physics.js`**: Contains pure geometry and physics calculation functions (e.g., `updateFallingBallTarget`, `distanceToCenterFromBallTouchPoint`).
-   **`state.js`**: Manages the simulation's state, containing functions for saving & loading data when leavning and reopening page, and resetting to initial state (`saveStateToLocalStorage`, `resetSeesaw`).
-   **`actions.js`**: Handles user actions and the main game loop logic (`pauseSimulation`, `createNewBall`).
-   **`ui_updates.js`**: Functions that update the UI elements (like the indicators, log panel etc.).
-   **`threads/`**: A directory containing the Web Workers for asynchronous tasks.
    -   **`rotationThread.js`**: The core part of the simulation, calculating the rotational physics.
    -   **`fallThread.js`**: Manages the falling process of each weight independently, with garivity force acting on them.

### 2. Physics Engine: The Role of Web Workers (Threads)

To isolate the motions of individual physical objects heavy calculations (just like in real world), the physics engine was seperated from the main thread as distinct sub-threads. 

-   The **`rotationThread.js`** is responsible for calculating the Angular acceleration every `loopPeriod` (20ms) based on the current Net Torque (τ_net) and Moment of Inertia (I). From this angular acceleration calculation, it updates angular velocity, and thus the new angle value, and send these back to the main thread to update the seasaw planks position, and display all these in HTML using DOM manipulation. Now as the angle updates, also the angular torque and thus, angle itself updates in the loop. This continues until the angle reaches it's max value (+30 or -30).
-   For physical accuracy, the torque calculation uses the **Lever Arm principle**, which accounts for the seesaw's current angle (`cos(θ)`) and multiplies it with `d * w` raw torque formula.

α = τ_net / I
 **`α (Alpha): Angular Acceleration`**. This determines how quickly the seesaw's rotational speed changes would change.
 
 **`τ_net (Tau_net): Net Torque`**. This is the total rotational force acting on the seesaw. It is the multiplication of (`cos(θ)`) and the difference between the raw torque from the right side and the from the left side.
τ_net = Σ(τ_right_side) - Σ(τ_left_side)
Σ(τ_right_side) = (`cos(θ)`) * Σ(d * w)
**`I (Inertia): Moment of Inertia`**. This represents the system's resistance to rotational motion. The heavier the objects and the farther they are from the pivot, the greater this resistance is.
I = Σ(massᵢ × distanceᵢ²).

### 3. Rendering: `<canvas>` vs. DOM

The `<canvas>` API was chosen over DOM manipulation (`div` elements) to ensure fluid and high-performance animations. Canvas provides significantly better performance, especially in scenarios with hundreds of objects, and offers complete, pixel-level control over the rendering process.

## ⚠️ Trade-offs and Limitations

-   **Web Worker Architecture:** While using a separate `fallThread` for each ball and a single `rotationThread` is a robust architectural choice for showcasing skills, a simpler simulation could have managed all animations in the main thread using `requestAnimationFrame`. This design, however, guarantees that the UI remains responsive no matter how complex the simulation becomes.
-   **Physical Realism:** The simulation successfully models fundamental rotational dynamics. More advanced physics concepts such as friction, air resistance, or inter-object collisions were considered outside the scope of this project.
-   **Mobile Responsiveness:** The project was developed primarily for desktop browsers. While `click` events function on mobile devices, the UI has not been fully optimized for smaller screens.

## 🤖 AI Usage

During the development of this project, AI tools (such as ChatGPT/Gemini) were used in the following assistive roles:

-   **Debugging:** Acted as a consultant for verifying complex trigonometric formulas (like the Lever Arm calculation) and identifying the root cause of `NaN` errors.
-   **Algorithm Exploration:** Used to explore different architectural approaches for designing stateful Web Workers that can be updated dynamically.
-   **Refactoring and Code Cleanup:** Provided suggestions for improving function names to be more semantic and for structuring the code into logical, modular blocks.

**AI was not used to generate or write the core logic or framework of the project.** All fundamental coding, architectural decisions, and the problem-solving process were conducted by me.
