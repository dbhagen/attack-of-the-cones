import { Game } from './core/Game';

// Initialize game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  // Start the render loop (but game won't update until mode is selected)
  game.start();

  // Hide loading screen
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = 'none';
  }

  // Enable debug overlay with URL parameter ?debug=1
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('debug') === '1') {
    const debugOverlay = document.getElementById('debug-overlay');
    if (debugOverlay) {
      debugOverlay.classList.remove('hidden');
    }
  }

  // HMR support
  if (import.meta.hot) {
    import.meta.hot.accept('./core/Game', () => {
      console.log('Hot reloading Game module...');
      // Could preserve game state here if needed
    });
  }
});
