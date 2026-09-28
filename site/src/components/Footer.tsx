import { business, footer } from '../content';

export function Footer() {
  return (
    <footer className="site-footer is-dark">
      <div className="wrap footer-grid">
        <p>{business.name} · {business.street}, {business.cityLine} · {business.hoursLabel}</p>
        <p><strong>{footer.notice}</strong> {footer.noticeBody}</p>
        <p className="footer-small">{footer.mediaNote} {footer.credits}</p>
      </div>
    </footer>
  );
}
