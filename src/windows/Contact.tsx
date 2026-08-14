import WindowWrapper from "#hoc/WindowWrapper";
import { contactEmail, socials } from "#constants/index";
import { WindowControls } from "#components";

const Contact = () => {
  return (
    <>
      <div id="window-header">
        <WindowControls target="contact" />
        <h2>Contact Me</h2>
      </div>

      {/* The window shell is transparent so its chrome can be glass; the
          content area is what supplies the opaque surface */}
      <div className="p-5 space-y-5 bg-white dark:bg-neutral-900">
        <img
          src="/images/avatar.webp"
          alt="Sebastien"
          width={80}
          height={80}
          className="size-20 rounded-full object-cover"
        />

        <h3>Let's connect</h3>
        <p>Got an idea? A bug to squash? or just wanna talk tech? I'm in.</p>
        <p>{contactEmail}</p>

        <ul>
          {socials.map(({ id, bg, link, icon, text }) => (
            <li key={id} style={{ backgroundColor: bg }}>
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                title={text}
              >
                <img src={icon} alt={text} className="size-5" />
                <p>{text}</p>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

const ContactWindow = WindowWrapper(Contact, "contact");

export default ContactWindow;
