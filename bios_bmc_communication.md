# OpenBMC Markdown Showcase

A practical sample about managing an **OpenBMC** system. It also demonstrates the Markdown features supported by this page.

> OpenBMC is an open-source platform for managing systems, including server baseboard management controllers (BMCs).
> Commands and endpoints below are examples; available services and hardware vary by platform.

## Quick links

- [OpenBMC project](https://www.openbmc.org/)
- [Redfish service root](https://github.com/openbmc/docs)
- [Common commands](#common-commands)

## Markdown text styles

Use **bold** for emphasis, _italic_ for a term, and ~~strikethrough~~ to mark a removed value. Inline code such as `systemctl` is useful for commands, file names, and service identifiers.

---

## Common commands

Check the BMC's uptime and inspect service status:

```bash
uptime
```

```bash
systemctl --failed
```

```bash
systemctl status xyz.openbmc_project.ObjectMapper.service
```

Follow the system journal while investigating a service:

```bash
journalctl -u xyz.openbmc_project.ObjectMapper.service --since "10 minutes ago"
```

```bash
journalctl -f
```

### Redfish request

Query the Redfish service root. Replace the example address with the address of your BMC.

```bash
curl --insecure --user root:password \
  https://192.168.1.100/redfish/v1/
```

The `--insecure` option skips certificate verification and is suitable only for a local lab example. Use trusted certificates in production.

## Example Redfish response

```json
{
  "@odata.type": "#ServiceRoot.v1_15_0.ServiceRoot",
  "Name": "ServiceRoot",
  "RedfishVersion": "1.15.0",
  "Systems": {
    "@odata.id": "/redfish/v1/Systems"
  },
  "Managers": {
    "@odata.id": "/redfish/v1/Managers"
  }
}
```

## Example configuration

```yaml
bmc:
  hostname: bmc.example.com
  network:
    protocol: dhcp
  services:
    redfish: enabled
```

## Service overview

| Area            | Example interface  | Purpose                                |
| --------------- | ------------------ | -------------------------------------- |
| Management API  | Redfish over HTTPS | Query and manage system resources      |
| Message bus     | D-Bus              | Communication between OpenBMC services |
| Service control | `systemd`          | Start, stop, and inspect services      |
| Event logging   | `journalctl`       | Review system and service logs         |

## Investigation checklist

1. Confirm that the BMC is reachable on the management network.
2. Check for failed services with `systemctl --failed`.
3. Review relevant logs with `journalctl`.
4. Query `/redfish/v1/` and follow resource links from the response.

Useful checks can also be grouped as a list:

- Network: verify the BMC address and link state.
- Services: inspect the specific service before restarting it.
- Logs: note the timestamp and error surrounding a failure.

## Service interaction diagram

```mermaid
flowchart LR
    Client[Management client] -->|HTTPS / Redfish| API[ bmcweb ]
    API -->|D-Bus| Services[OpenBMC services]
    Services -->|D-Bus| Hardware[Sensor and platform interfaces]
    Services --> Logs[System journal]
```

## Further reading

See the [OpenBMC documentation repository](https://github.com/openbmc/docs) for project documentation and platform-specific details.
