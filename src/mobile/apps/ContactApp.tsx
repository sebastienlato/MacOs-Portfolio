import { Mail } from "lucide-react";

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
          <a href={link} target="_blank" rel="noopener noreferrer">
            <span className="glyph" style={{ backgroundColor: bg }}>
              <img src={icon} alt="" />
            </span>
            <span className="name">{text}</span>
          </a>
        </li>
      ))}
    </ul>
  </AppFrame>
);

export default ContactApp;
