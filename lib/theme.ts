export const THEME_KEY = "tapaccess-theme";

/**
 * Runs before first paint (inline in app/layout.tsx) so a saved light/dark
 * choice never flashes the wrong theme. Card pages bring their own colours
 * and are skipped.
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if((t==="light"||t==="dark")&&location.pathname.indexOf("/c/")!==0)document.documentElement.dataset.theme=t}catch(e){}`;
