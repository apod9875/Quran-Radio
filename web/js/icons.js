window.SvgIcons = {
  play: (size = 24, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86a1 1 0 0 0-1.5.86z"/>
    </svg>`,

  pause: (size = 24, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2 2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm12 0a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2 2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>
    </svg>`,

  spinner: (size = 24, className = "") => `
    <svg class="svg-icon spin-animation ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <circle cx="12" cy="12" r="9" stroke-opacity="0.25"/>
      <path d="M12 3a9 9 0 0 1 9 9"/>
    </svg>`,

  prev: (size = 24, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 6a1 1 0 0 1 2 0v12a1 1 0 0 1-2 0V6zm11.5 0.5a1 1 0 0 0-1.5-.86l-8 5.5a1 1 0 0 0 0 1.72l8 5.5a1 1 0 0 0 1.5-.86V6.5z"/>
    </svg>`,

  next: (size = 24, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 6a1 1 0 0 1 2 0v12a1 1 0 0 1-2 0V6zM6.5 6.5a1 1 0 0 1 1.5-.86l8 5.5a1 1 0 0 1 0 1.72l-8 5.5a1 1 0 0 1-1.5-.86V6.5z"/>
    </svg>`,

  heartOutline: (size = 22, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>`,

  heartFilled: (size = 22, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="#EF5350">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>`,

  volumeLow: (size = 20, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
    </svg>`,

  volumeHigh: (size = 20, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>`,

  volumeMute: (size = 20, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
    </svg>`,

  moon: (size = 22, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.3 2a10 10 0 0 0-.19 20 10 10 0 0 0 8.76-5.18 1 1 0 0 0-1.07-1.46 8 8 0 1 1-8.96-12.29 1 1 0 0 0-1.07-1.46A9.9 9.9 0 0 0 12.3 2z"/>
    </svg>`,

  share: (size = 22, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>`,

  info: (size = 20, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
    </svg>`,

  search: (size = 20, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>`,

  close: (size = 20, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>`,

  install: (size = 18, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
      <path d="M12 7v6m-3-3l3 3 3-3"/>
    </svg>`,

  globe: (size = 18, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>`,

  radio: (size = 22, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.24 6.15C2.51 6.43 2 7.17 2 8v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8c0-.83-.51-1.57-1.24-1.85L16.2 4.47l.8-1.74a1 1 0 1 0-1.81-.84l-1.33 2.92L4.76 5.37a2 2 0 0 0-1.52.78zM20 20H4V8h16v12zm-6-6a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm4-3a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
    </svg>`,

  github: (size = 18, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>`,

  externalLink: (size = 18, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>`,

  prayer: (size = 28, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>`,

  developer: (size = 22, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>`,

  cache: (size = 20, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 2H5a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3zm-7 16c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm5-11H7V5h10v2z"/>
    </svg>`,

  cloudDownload: (size = 18, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 17l4 4 4-4m-4-5v9"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
    </svg>`,

  cloudCheck: (size = 18, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9"/><polyline points="9 16 12 19 19 12"/>
    </svg>`,

  refresh: (size = 18, className = "") => `
    <svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>`
};

