# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | Yes       |
| < Latest | No      |

We only provide security fixes for the latest release. Please keep your
installation up to date.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

**Email:** security@taskclaw.co

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### What to expect

- **Acknowledgment** within 48 hours
- **Assessment** within 7 business days
- **Fix timeline** depends on severity; critical issues are prioritized
- **Disclosure** coordinated with you, typically within 90 days

### What qualifies

- Authentication or authorization bypass
- SQL injection, XSS, or other injection vulnerabilities
- Data exposure or leakage
- Privilege escalation
- Remote code execution

### Out of scope

- Social engineering attacks
- Denial of service (DoS/DDoS)
- Vulnerabilities in third-party dependencies (report those upstream)
- Issues requiring physical access
- Spam or phishing

## Bug Bounty

We do not currently offer a bug bounty program. However, we acknowledge
all valid security reporters in our release notes (with your permission).

## Security Best Practices for Self-Hosters

- Keep your TaskClaw installation updated to the latest version
- Use strong, unique values for `JWT_SECRET` and `ENCRYPTION_KEY`
- Never expose your Supabase Service Role Key publicly
- Use HTTPS with a reverse proxy (nginx, Caddy, or Traefik)
- Restrict database access to internal networks only
- Regularly rotate API keys and secrets
