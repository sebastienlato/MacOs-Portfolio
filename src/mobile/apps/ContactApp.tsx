import { ExternalLink, Mail } from "lucide-react";

import AppFrame from "#mobile/AppFrame";
import { socials } from "#constants/index";

const EMAIL = "contact@latodev.pro";

/**
 * Contact. The one screen that genuinely gains from being on a phone: the email
 * row is a real mailto, so tapping it opens Mail with the address filled in.
 */
const ContactApp = () => (
  <AppFrame title="Contact">
    <div className="contact-card">
      <img src="/images/avatar.webp" alt="Sebastien Lato" />
      <h2>Sebastien Lato</h2>
      <p>Mobile &amp; web developer</p>
    </div>

    <p className="contact-blurb">
      Got an idea? A bug to squash? Or just wanna talk tech? I&apos;m in.
    </p>

    <a className="contact-email" href={`mailto:${EMAIL}`}>
      <span className="glyph">
        <Mail size={18} />
      </span>
      <span>
        <strong>Email me</strong>
        <small>{EMAIL}</small>
      </span>
    </a>

    <h2 className="files-section">Elsewhere</h2>

    <ul className="contact-socials">
      {socials.map(({ id, bg, link, icon, text }) => (
        <li key={id}>
          {/* The glyph says "this leaves" to anyone looking; the label says it
              to anyone listening, and matches the wording the Home Screen's
              link tiles already use. */}
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${text} (opens in a new tab)`}
          >
            <span className="glyph" style={{ backgroundColor: bg }}>
              <img src={icon} alt="" />
            </span>
            <span className="name">{text}</span>
            {/* Files already marks a row that leaves with this exact glyph.
                Without it these four were the only rows on the phone that go
                somewhere else without saying so. */}
            <ExternalLink size={15} className="chevron" aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  </AppFrame>
);

export default ContactApp;
