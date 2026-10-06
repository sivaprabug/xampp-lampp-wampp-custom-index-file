# Custom index files for XAMPP LAMPP WAMPP

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/sivaprabug/xampp-lampp-wampp-custom-index-file)

## Documentation viewer

The Systems Library viewer renders local Markdown documentation for OpenBMC,
Redfish APIs, command references, and system architecture without changing the
existing `?file=filename.md` route.

### Getting started

Use a PHP-enabled web server, such as Apache in XAMPP, LAMPP, or WAMPP, and a
modern browser. PHP 8 or newer is recommended. No build step or package installation
is required.

1. Place this project in your server's document root and start the web server.
2. Open the project index and select a Markdown file, or use the direct viewer URL below.
3. Adjust the URL's directory and port to match your installation.

<http://localhost/xampp-lampp-wampp-custom-index-file/library/render.php?file=bios_bmc_communication.md>

Alternatively, run PHP's development server from the project root:

```sh
php -S 127.0.0.1:8097 -t .
```

Then open <http://127.0.0.1:8097/library/render.php?file=bios_bmc_communication.md>.
The development server is for local use, not production hosting.

### Viewer features

- Sticky toolbar with Home/Library/file breadcrumbs and a copyable Target BMC IP.
- Searchable file list, collection filters, file counts, and active-document highlighting.
- Collapsible library and table-of-contents panels, with overlay panels on smaller screens.
- Automatic table of contents for `#`, `##`, and `###` headings, with active-section highlighting.
- Clickable heading links and unique anchors for repeated headings.
- Dark mode by default, with a light theme and theme preference saved in browser storage.
- Syntax highlighting for Bash, JSON, YAML, and other languages supported by highlight.js.
- Log highlighting for timestamps, severity levels, and process identifiers.
- Log fence labels: `log`, `logs`, `syslog`, and `system-log`.
- Code-copy buttons with confirmation and a fallback when the Clipboard API is unavailable.
- Mermaid diagrams from `mermaid` fenced code blocks, with zoom, reset, and fullscreen preview.
- Expandable diagram source. Close previews with the close button or Escape.
- Scrollable tables with zebra striping and row highlighting.
- Raw Markdown access and Export PDF through the browser's print dialog, with navigation hidden and commands wrapped.

### Target IP substitution

The Target BMC IP field starts at `172.31.98.90` and accepts IPv4 addresses only,
not hostnames or IPv6. Updating it changes displayed code and copied commands;
it does not contact the BMC, execute commands, or modify Markdown source files.

These placeholders are replaced in all code blocks:

- `192.168.1.100`
- `{{BMC_IP}}` and `{{TARGET_IP}}`
- `<BMC_IP>` and `<TARGET_IP>`

HTTP(S) IPv4 hosts are also replaced in `bash`, `sh`, `shell`, `shell-session`,
`console`, and `text` blocks containing `curl`, `wget`, `ssh`, or `ipmitool`.
This additional rule preserves hosts beginning with `127.`, `0.`, or `169.254.`;
it does not replace arbitrary addresses or SSH/IPMI host arguments.

Clearing the field or entering an invalid address restores the original code.
The raw Markdown view always retains the original placeholders and addresses.

### Documents and collections

Add Markdown files directly to the project root. Subdirectories and paths outside
the root are not supported. Collection assignment uses case-insensitive filename
matches in the following priority order:

| Filename contains                                    | Collection          |
| ---------------------------------------------------- | ------------------- |
| `redfish`, `rest`, or `api`                          | Redfish APIs        |
| `command`, `systemctl`, `journal`, or `cli`          | Command Reference   |
| `bios`, `architecture`, `communication`, or `system` | System Architecture |
| None of the above                                    | OpenBMC Guides      |

Relative links to root-level Markdown files are routed through the viewer.
External HTTP(S) links open in a new tab. Raw HTML is escaped by Parsedown's safe mode.

Append `&format=raw` to a valid document URL to view its original Markdown as
`text/plain`. Missing or invalid file parameters show a library fallback page
with HTTP 400; missing or unreadable files return 404; read failures return 500.

### Implementation and dependencies

| File                                           | Responsibility                                                                |
| ---------------------------------------------- | ----------------------------------------------------------------------------- |
| [library/render.php](library/render.php)       | File validation, Parsedown integration, raw view, and workspace HTML          |
| [library/parsedown.php](library/parsedown.php) | Bundled Markdown parser                                                       |
| [zcss/docs.css](zcss/docs.css)                 | Theme variables, responsive layout, code/table styling, and print styles      |
| [zjs/docs.js](zjs/docs.js)                     | TOC, filtering, clipboard, target substitution, theme switching, and diagrams |

IBM Plex fonts, Font Awesome, highlight.js, and Mermaid load from external CDNs
and require internet access. JavaScript is required for interactive controls,
heading anchors, highlighting, and diagram rendering. If highlight.js or Mermaid
cannot load, code and diagram sources remain readable.

Sample Screeshots:

![Original custom index screenshot](https://raw.githubusercontent.com/gsivaprabu/xampp-lampp-wampp-custom-index-file/master/customIndexFileView.png)

![Original custom index inner page screenshot](https://raw.githubusercontent.com/gsivaprabu/xampp-lampp-wampp-custom-index-file/master/customIndexFileInnerView.png)
