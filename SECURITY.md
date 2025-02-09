# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 0.8.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Notable Nomads Backend API seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to contact@notablenomads.com

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the requested information listed below (as much as you can provide) to help us better understand the nature and scope of the possible issue:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

## Preferred Languages

We prefer all communications to be in English.

## Security Update Process

1. The security report is received and assigned to an owner
2. The issue is confirmed and a list of affected versions is determined
3. Code is audited to find any similar problems
4. Fixes are prepared and tested
5. A new version is released and the fix is deployed

## Security Best Practices

When contributing to this repository, please ensure you follow these security best practices:

1. Never commit sensitive credentials or API keys
2. Always validate and sanitize user input
3. Use prepared statements for database queries
4. Keep dependencies up to date
5. Follow the principle of least privilege
6. Implement proper error handling
7. Use secure communication protocols (HTTPS)
8. Implement proper authentication and authorization
9. Follow secure coding guidelines

## Bug Bounty Program

We currently do not have a bug bounty program, but we greatly appreciate any security findings you share with us and will publicly acknowledge your responsible disclosure if you want.
