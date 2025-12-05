# Anglican Broadcast Overlay System

A web-based graphics overlay system for church live streaming, designed for local LAN use without internet dependency.

## Features

- **Dashboard Control**: Manage lower thirds, full-screen slates, timers, and clocks.
- **Real-Time Sync**: Instant updates across devices via Socket.IO.
- **Overlay Mode**: Dedicated display for projectors/screens.
- **Local Persistence**: Data saved to JSON file, survives restarts.

## Setup

1. Install Node.js (cross-platform).
2. Clone or download the project.
3. Run `npm install` to install dependencies.
4. Run `npm start` or `node server.js` to start the server on port 3000.

## Usage

- Open `http://localhost:3000` on the controller machine.
- Use "Copy Link" to get the overlay URL, open on display machine with `?mode=overlay`.
- Or use "Launch Overlay" to pop up the window.

## Architecture

- **Server**: Node.js + Express + Socket.IO, serves static files and handles real-time communication.
- **Client**: Vanilla JS, modularized into separate files for maintainability.
- **Data**: Stored in `church_data.json` locally.

## Cross-Platform

Tested on Windows, compatible with Linux for deployment.