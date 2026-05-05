export const FM_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  .fm-root, .fm-root *, .fm-root *::before, .fm-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .fm-root { font-family: 'Inter', system-ui, sans-serif; color: #1A1A1A; -webkit-font-smoothing: antialiased; background: #F5F4F1; }

  .fm-root ::-webkit-scrollbar { width: 3px; }
  .fm-root ::-webkit-scrollbar-track { background: transparent; }
  .fm-root ::-webkit-scrollbar-thumb { background: #DDDBD6; border-radius: 3px; }

  @keyframes fm-pulse-ring  { 0% { transform: scale(.8); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }
  @keyframes fm-pulse-dot   { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }
  @keyframes fm-slide-down  { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fm-fade-in     { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fm-modal-pop   { from { opacity: 0; transform: scale(.97) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes fm-spin        { to { transform: rotate(360deg); } }
  @keyframes fm-toast-in    { from { opacity: 0; transform: translateX(110%); } to { opacity: 1; transform: translateX(0); } }
  @keyframes fm-toast-out   { from { opacity: 1; } to { opacity: 0; transform: translateX(110%); } }
  @keyframes fm-drawer-slide { from { transform: translateX(-100%); } to { transform: translateX(0); } }

  .fm-new-item  { animation: fm-slide-down .24s cubic-bezier(.4,0,.2,1) forwards; }
  .fm-modal-pop { animation: fm-modal-pop .2s cubic-bezier(.4,0,.2,1) forwards; }
  .fm-fade-bg   { animation: fm-fade-in .15s ease forwards; }
  .fm-toast-in  { animation: fm-toast-in .28s cubic-bezier(.4,0,.2,1) forwards; }
  .fm-toast-out { animation: fm-toast-out .22s ease forwards; }
  .fm-mob-drawer { animation: fm-drawer-slide .22s cubic-bezier(.4,0,.2,1); }

  .fm-feed-row { transition: background .08s ease; cursor: pointer; }
  .fm-feed-row:hover { background: #F7F6F2 !important; }

  .fm-nav-btn { cursor: pointer; border-radius: 8px; transition: background .1s; }
  .fm-nav-btn:hover { background: #F0EEE9; }
  .fm-nav-btn.fm-active { background: rgba(255,80,0,.07); }
  .fm-nav-btn.fm-active .fm-nav-lbl { color: #FF5000 !important; }
  .fm-nav-btn.fm-active .fm-nav-ico { color: #FF5000 !important; }

  .fm-btn-cta { transition: all .15s cubic-bezier(.4,0,.2,1) !important; }
  .fm-btn-cta:hover:not(:disabled) { background: #E84800 !important; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(255,80,0,.25) !important; }
  .fm-btn-cta:active:not(:disabled) { transform: translateY(0) !important; }

  .fm-list-row { cursor: pointer; transition: background .15s ease; }
  .fm-list-row:hover { background: #F7F6F3 !important; }
  .fm-list-row:hover .fm-list-row-bar { background: #1F2D44 !important; }

  .fm-icon-btn { transition: background .1s; cursor: pointer; }
  .fm-icon-btn:hover { background: #F0EEE9 !important; }

  .fm-action-link { background: none; border: none; padding: 0; font-family: inherit; cursor: pointer; transition: color .12s; }
  .fm-action-link:hover { text-decoration: underline; }

  .fm-row-chev { opacity: 0; transition: opacity .15s ease; display: flex; color: #C0BDB8; flex-shrink: 0; transform: rotate(-90deg); }
  .fm-list-row:hover .fm-row-chev { opacity: 0.7; }

  .fm-root input, .fm-root textarea, .fm-root select { font-family: 'Inter', system-ui, sans-serif; outline: none; }
  .fm-root input:focus, .fm-root textarea:focus, .fm-root select:focus { border-color: #FF5000 !important; box-shadow: 0 0 0 3px rgba(255,80,0,.07) !important; }
  .fm-root .fm-search-input:focus { border-color: #CCCAC5 !important; box-shadow: none !important; background: #fff !important; }

  .fm-issue-card { transition: box-shadow .15s ease, transform .15s ease; }
  .fm-issue-card:hover { box-shadow: 0 4px 22px rgba(0,0,0,.08) !important; transform: translateY(-1px); }

  @media (max-width: 639px) {
    .fm-root .fm-hide-mob { display: none !important; }
    .fm-root .fm-issue-card:hover { transform: none !important; box-shadow: 0 1px 4px rgba(0,0,0,.04) !important; }
    .fm-root .fm-feed-row:hover  { background: transparent !important; }
  }
  @media (min-width: 640px) {
    .fm-root .fm-hide-desk { display: none !important; }
  }
`;
