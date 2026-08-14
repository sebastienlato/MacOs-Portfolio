/**
 * Puts `text` on the clipboard, and says whether it got there.
 *
 * `navigator.clipboard` is the right API and is not always present: it needs a
 * secure context, so it is there over https and on localhost and undefined the
 * moment the site is opened over plain http on a LAN address — which is exactly
 * how someone looks at a portfolio from their phone on the same wifi. The
 * deprecated path below is the fallback for that case, and only for that case.
 *
 * The textarea is positioned off-screen rather than hidden: `display: none` and
 * `visibility: hidden` both make a node unselectable, and selecting it is the
 * whole mechanism.
 */
export const copyText = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Denied, or no permission in this context — fall through and try the old way
  }

  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "-9999px";
    document.body.append(field);
    field.select();
    const copied = document.execCommand("copy");
    field.remove();
    return copied;
  } catch {
    return false;
  }
};
