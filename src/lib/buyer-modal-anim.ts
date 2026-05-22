/** Shared enter animation for buyer account modals (invoice, pay, receipt). */
export const buyerModalAnimStyles = `
  @keyframes buyerModalFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes buyerModalSlideUp {
    from {
      opacity: 0;
      transform: translateY(18px) scale(0.97);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  .buyer-modal-overlay {
    animation: buyerModalFadeIn 0.22s ease-out both;
  }
  .buyer-modal-panel {
    animation: buyerModalSlideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @media (prefers-reduced-motion: reduce) {
    .buyer-modal-overlay,
    .buyer-modal-panel {
      animation: none;
    }
  }
`;
