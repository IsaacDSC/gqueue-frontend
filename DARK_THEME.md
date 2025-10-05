# Vercel-Inspired Dark Theme

## Overview

This document describes the implementation of a Vercel-inspired dark theme for the GQueue Dashboard. The theme uses a clean, minimal design with deep dark backgrounds and high contrast text for optimal readability.

## Color Palette

### Dark Theme Colors
- **Background**: `#0a0a0a` - Very dark main background
- **Surface**: `#111111` - Cards, modals, and elevated surfaces
- **Border**: `#1a1a1a` - Subtle borders and dividers
- **Hover**: `#1f1f1f` - Hover states for interactive elements
- **Text**: `#ededed` - Primary text color
- **Muted Text**: `#a1a1a1` - Secondary and muted text
- **Accent**: `#2563eb` - Blue accent for buttons and links

## Implementation

### CSS Classes

The theme uses custom Tailwind CSS classes with the `dark:` prefix for dark mode variants:

#### Layout Components
- `.dark-header` - Header with dark surface background
- `.dark-card` - Card components with dark styling
- `.dark-modal` - Modal dialogs with dark theme

#### Interactive Elements
- `.dark-button` - Buttons with dark theme styling
- `.dark-input` - Form inputs with dark backgrounds

#### Typography
- `.dark-text` - Primary text color for dark theme
- `.dark-text-muted` - Secondary/muted text color

### Usage Examples

```html
<!-- Main container -->
<body class="bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-dark-text">

<!-- Header -->
<header class="dark-header">

<!-- Cards -->
<div class="dark-card p-6">

<!-- Buttons -->
<button class="dark-button px-3 py-2 rounded-md">

<!-- Form inputs -->
<input class="dark-input rounded-md py-2 px-3">

<!-- Text elements -->
<h1 class="dark-text">Primary Text</h1>
<p class="dark-text-muted">Secondary Text</p>
```

### Theme Toggle

The application includes JavaScript-powered theme switching:
- Saves user preference to localStorage
- Applies theme on page load
- Smooth transitions between light and dark modes
- Updates button icons and text accordingly

### Building

To compile the CSS with the dark theme:

```bash
yarn build-css
```

To watch for changes during development:

```bash
yarn watch-css
```

## File Structure

```
src/
├── input.css     # Source CSS with dark theme utilities
├── output.css    # Compiled Tailwind CSS
├── index.html    # Main dashboard with dark theme classes
└── setup.html    # Setup page with dark theme styling
```

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Features

- **Clean Design**: Minimal, professional appearance inspired by Vercel
- **High Contrast**: Excellent readability with carefully chosen colors
- **Smooth Transitions**: Animated theme switching
- **Responsive**: Works across all screen sizes
- **Persistent**: Remembers user theme preference
- **Consistent**: Unified styling across all components
