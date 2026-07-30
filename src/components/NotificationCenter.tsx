import { useEffect, useRef } from "react";
import dayjs from "dayjs";

import { blogPosts, locations, socials } from "#constants/index";
import useSystemStore from "#store/system";
import useWindowStore from "#store/window";

const projectCount = locations.work.children?.length ?? 0;

/**
 * Notifications are drawn from the real content rather than invented, so the
 * panel stays true as the portfolio changes: the newest post, what is actually
 * in Work, and a standing note. Each one opens the thing it is about.
 */
const useNotifications = () => {
  const { openWindow } = useWindowStore();
  const [latest] = blogPosts;

  return [
    {
      id: "post",
      app: "Articles",
      icon: "/images/safari.png",
      title: latest.title,
      body: "New post on the blog",
      time: latest.date,
      onClick: () => openWindow("safari"),
    },
    {
      id: "work",
      app: "Portfolio",
      icon: "/images/finder.png",
      title: `${projectCount} projects in Work`,
      body: "Open the Finder to look through them",
      time: "Now",
      onClick: () => openWindow("finder"),
    },
    {
      id: "hire",
      app: "Contact",
      icon: "/images/contact.png",
      title: "Open to new projects",
      body: "Mobile and web — get in touch",
      time: "Now",
      onClick: () => openWindow("contact"),
    },
  ];
};

const NotificationCenter = () => {
  const { notificationCenterOpen, setNotificationCenterOpen } =
    useSystemStore();
  const { openWindow } = useWindowStore();
  const notifications = useNotifications();
  const panelRef = useRef<HTMLElement>(null);
  const now = dayjs();

  useEffect(() => {
    if (!notificationCenterOpen) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setNotificationCenterOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [notificationCenterOpen, setNotificationCenterOpen]);

  if (!notificationCenterOpen) return null;

  const dismiss = () => setNotificationCenterOpen(false);

  const run = (action: () => void) => {
    dismiss();
    action();
  };

  return (
    <>
      {/* Transparent, not dimmed — macOS slides the panel over an untouched
          desktop. It exists only to catch the click that closes the panel. */}
      <div className="notification-backdrop" onMouseDown={dismiss} />

      <aside
        id="notification-center"
        ref={panelRef}
        aria-label="Notification Center"
      >
        <section className="notifications">
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              className="notification"
              onClick={() => run(n.onClick)}
            >
              <img src={n.icon} alt="" />
              <div className="body">
                <div className="meta">
                  <span className="app">{n.app}</span>
                  <span className="time">{n.time}</span>
                </div>
                <h4>{n.title}</h4>
                <p>{n.body}</p>
              </div>
            </button>
          ))}
        </section>

        <section className="widgets">
          <div className="widget calendar">
            <span className="weekday">{now.format("dddd")}</span>
            <span className="day">{now.format("D")}</span>
            <span className="month">{now.format("MMMM YYYY")}</span>
          </div>

          <button
            type="button"
            className="widget resume"
            onClick={() => run(() => openWindow("resume"))}
          >
            <h4>Resume</h4>
            <p>Swift, SwiftUI, React, TypeScript</p>
            <span className="cta">Open PDF</span>
          </button>

          <div className="widget links">
            <h4>Elsewhere</h4>
            <ul>
              {socials.map((social) => (
                <li key={social.id}>
                  <a
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ backgroundColor: social.bg }}
                    title={social.text}
                  >
                    <img src={social.icon} alt={social.text} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </aside>
    </>
  );
};

export default NotificationCenter;
