---
    name: lucide-react brand icons
    description: lucide-react no longer ships social/brand icons (Facebook, Instagram, Twitter, LinkedIn, YouTube, etc.)
    ---

    Importing brand-name icons like `Facebook` or `Instagram` from `lucide-react` fails at runtime with "does not provide an export named ...", because current lucide-react versions dropped brand icons entirely.

    **Why:** lucide-react is a general-purpose icon set; brand marks are excluded from the package (trademark/maintenance reasons).

    **How to apply:** For social links, use generic outline icons (e.g. `Share2`, `AtSign`, `Link`, `MessageCircle`) or bring in a dedicated brand-icon package (e.g. `simple-icons` / `react-icons/fa`) if pixel-accurate brand logos are required.
    