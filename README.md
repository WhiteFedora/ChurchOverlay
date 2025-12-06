# Anglican Streaming Graphics Suite

A professional, local network-based graphics overlay system designed for church live streams. Control lower thirds, full-screen slates, and service timers from any device on your network.

## Features

*   **Dynamic Lower Thirds**: smooth entrance/exit animations with customizable text for names and roles.
*   **Transition Control**: Slide, Wipe, or Fade transitions with adjustable speed and easing.
*   **Visual Designer**: Built-in drag-and-drop designer to customize the look of your lower thirds (colors, fonts, shadows, borders) without touching code.
*   **Full Screen Slates**: Manage and display welcome screens, sermon titles, and announcements.
*   **Service Timer**: specialized countdown timer and "Service Starts At" messages.
*   **Mobile Friendly**: The controller dashboard works on any phone, tablet, or laptop.
*   **OBS Integration**: Simple Browser Source integration supporting alpha transparency.

## Prerequisites

*   [Node.js](https://nodejs.org/) (Version 16 or higher recommended)

## Installation

1.  Clone this repository or download the ZIP.
    ```bash
    git clone https://github.com/yourusername/church-overlay-system.git
    ```
2.  Navigate to the project folder.
    ```bash
    cd church-overlay-system
    ```
3.  Install dependencies.
    ```bash
    npm install
    ```

## Usage

### Starting the System
You can start the system in two ways:
*   **Windows**: Double-click the `start_overlay.bat` file.
*   **Terminal**: Run `npm start`.

The server will start on port `3000`.

### Accessing the Controller
Open a web browser on any device connected to the same network and go to:
`http://<YOUR_COMPUTER_IP>:3000` 
*(The console window will display the exact IP addresses you can use)*

### Setting up in OBS
1.  Add a new **Browser Source** in OBS.
2.  Set the URL to: `http://localhost:3000` (or the IP if OBS is on a different machine).
3.  Set the Width to `1920` and Height to `1080`.
4.  **Important**: Check "Shutdown source when not visible" and "Refresh browser when scene becomes active" if you notice any sync issues, though usually, they are not needed.

### Using the Designer
Navigate to `http://localhost:3000/designer.html` to customize your graphics.
*   Adjust box size, color, and position.
*   Change fonts, weights, and text transforms.
*   Add and customize drop shadows.
*   Click **Apply Design** to instantly update the live overlay.

## Support My Church

If you find this software useful for your ministry, please consider supporting me to improve my church's live stream


## License

This project is licensed under the MIT License.
